import os
from datetime import datetime, timedelta
import plaid
import json
import time
from flask import render_template
from flask import request
from flask import jsonify
import requests
import sys
from keys import MAILGUN_DOMAIN, MAILGUN_API_KEY
import atexit
from apscheduler.schedulers.background import BackgroundScheduler
import time
from keys import PLAID_CLIENT_ID, PLAID_SECRET, PLAID_PUBLIC_KEY
from models import *
from auth import requires_auth
import ssl
from flaskapp import app
from flask_cors import CORS

CORS(app)

ssl._create_default_https_context = ssl._create_unverified_context

# Use `development` to test with live users and credentials and `production`
# to go live
PLAID_ENV = os.getenv('PLAID_ENV', 'development')
# PLAID_PRODUCTS is a comma-separated list of products to use when initializing
# Link. Note that this list must contain 'assets' in order for the app to be
# able to create and retrieve asset reports.
PLAID_PRODUCTS = os.getenv('PLAID_PRODUCTS', 'transactions')

NUMBER_OF_TRANSACTIONS = 500
LAST_TWO_YEARS = -730
LAST_MONTH = -30

client = plaid.Client(client_id=PLAID_CLIENT_ID, secret=PLAID_SECRET,
                      public_key=PLAID_PUBLIC_KEY, environment=PLAID_ENV, api_version='2018-05-22')

@app.route('/')
def index():
    return "hello"

access_token = None

# Creates a new user if they don't exist yet
@app.route('/new_user', methods=['POST'])
@requires_auth
def new_user():
    user_id = request.get_json()['user_id']
    user_email = request.get_json()['user_email']
    user = update_user(user_id, user_email)
    return jsonify({'user': user.as_dict()})

# Get bank account items from a user
@app.route('/get_items', methods=['POST'])
@requires_auth
def get_items():
    user_id = request.get_json()['user_id']
    items = get_items_for_user(user_id)
    return jsonify({'error': None, 'items': items})

# Removes bank account item from a user
@app.route('/remove_item', methods=['POST'])
@requires_auth
def remove_item():
    user_id = request.get_json()['user_id']
    item_id = request.get_json()['item_id']
    removed_item = remove_item_from_user(user_id, item_id).as_dict()
    removed_item.pop('access_token')
    return jsonify({'removed_item': removed_item})

# Exchange token flow - exchange a Link public_token for
# an API access_token
# https://plaid.com/docs/#exchange-token-flow
@app.route('/get_access_token', methods=['POST'])
@requires_auth
def get_access_token():
    global access_token
    user_id = request.get_json()['user_id']
    public_token = request.get_json()['public_token']
    item_name = request.get_json()['item_name']

    result = Item.query.filter(Item.user_id == user_id, Item.item_name == item_name).first()

    if result:
      access_token = result.access_token
      item_id = result.item_id
 
    else:
      try:
          exchange_response = client.Item.public_token.exchange(public_token)
          access_token = exchange_response['access_token']
          item_id = exchange_response['item_id']
          exchange_response.pop('access_token')
      except plaid.errors.PlaidError as e:
          return jsonify(format_error(e))

    # TO DO finish when we want to display bank images
    # try:
    #   item_response = client.Institutions.get_by_id(item_id, _options={'include_optional_metadata': True})
    #   print(item_response)
    #   print(item_response.institutions[0].logo)
    # except plaid.errors.PlaidError as e:
    #   return jsonify(format_error(e))

    add_item_to_user(user_id, access_token, item_id, item_name)
    init_account(user_id, access_token)
    return "success"

@app.route('/update_transactions', methods=['POST'])
@requires_auth
def update_transactions():
    new_transactions = request.get_json()['new_transactions']

    for transaction in new_transactions:
        transaction_dict = dict(transaction)
        transaction_dict["date"] = datetime.strptime(
            transaction_dict["date"], '%m-%d-%y')
        
        # If user labeled as subscription, note it as a possible subscription for others
        old_transaction = Transaction.query.filter(Transaction.transaction_id ==
                                 transaction["transaction_id"]).first()
        if transaction_dict['label'] == "subscription" and old_transaction.label != "subscription":
            possible_subscription = Subscription.query.filter(Subscription.name == transaction["name"]).first()
            if possible_subscription:
              possible_subscription.count += 1
            else:
              possible_subscription = Subscription(name = transaction.name, count = 1)
            db.session.add(possible_subscription)

        Transaction.query.filter(Transaction.transaction_id ==
                                 transaction["transaction_id"]).update(transaction_dict)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()

    return 'success'

@app.route('/intro_seen', methods=['POST'])
@requires_auth
def intro_seen():
  user_id = request.get_json()['user_id']
  User.query.filter(User.user_id == user_id).update({"intro_seen": True})
  try:
      db.session.commit()
  except IntegrityError:
      db.session.rollback()

  return 'success'

@app.route('/fetch_user_data', methods=['POST'])
@requires_auth
def fetch_user_data():
    user_id = request.get_json()['user_id']
    user = User.query.filter(User.user_id == user_id).first()

    pull_latest_transactions(user_id)
    transactions = [transaction.as_dict() for transaction in Transaction.query.filter(Transaction.user_id == user_id)]
    updates = [{}] #get_updates_since_last_pull(start_date)
    accounts = [account.as_dict() for account in Card.query.filter(Card.user_id == user_id)]
    return jsonify({'error': None, 'transactions': transactions, 'updates': updates, 'accounts': accounts, 'user': user.as_dict()})

def get_access_tokens(user_id):
    """ Returns list of access tokens that belong to the user """
    return [access_token for access_token_tuple in Item.query.filter(Item.user_id == user_id).with_entities(Item.access_token) for access_token in access_token_tuple]


def update_user(user_id, user_email):
    user = User.query.filter(User.user_id == user_id).first()
    if not user:
        user = User(user_id=user_id, email=user_email)
        db.session.add(user)
        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
    return user

def pull_latest_transactions(user_id):
    """ Pulls and stores latest transactions """
    access_tokens = get_access_tokens(user_id)
    user = User.query.filter(User.user_id == user_id).first()

    # Add transactions since last pull
    start_date = get_start_date(user)
    end_date = '{:%Y-%m-%d}'.format(datetime.now())
    
    try:
        for access_token in access_tokens:
          transactions_response = client.Transactions.get(access_token, start_date, end_date)
          transactions = transactions_response["transactions"]
          while len(transactions) < transactions_response['total_transactions']:
            transactions_response = client.Transactions.get(access_token, start_date='2018-01-01', end_date='2018-02-01', offset=len(transactions))
            transactions.extend(transactions_response['transactions'])
          
          item_id = Item.query.filter(Item.access_token == access_token).first().item_id
          add_transactions_to_user(transactions, user_id, item_id)
    except plaid.errors.PlaidError as e:
        return jsonify(format_error(e))
    
    set_last_pull_date(user, end_date)
    find_subscriptions()

def add_item_to_user(user_id, access_token, item_id, item_name):
    """Adds item with access token to a user"""
    if not is_item_new(user_id, access_token):
      return "Item already exists"

    item = Item(user_id=user_id,
                access_token=access_token,
                item_id=item_id,
                item_name=item_name)
    db.session.add(item)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
    return item

def init_account(user_id, access_token):
  """ Adds accounts and pulls transactions first time for user """
  # Add account
  add_account_to_user(user_id, access_token)
  
  # Add transactions for that account
  start_date = '{:%Y-%m-%d}'.format(datetime.now() + timedelta(LAST_TWO_YEARS))
  end_date = '{:%Y-%m-%d}'.format(datetime.now())
  
  try:
    transactions_response = client.Transactions.get(access_token, start_date, end_date)
    transactions = transactions_response["transactions"]
    while len(transactions) < transactions_response['total_transactions']:
      transactions_response = client.Transactions.get(access_token, start_date='2018-01-01', end_date='2018-02-01', offset=len(transactions))
      transactions.extend(transactions_response['transactions'])

  except plaid.errors.PlaidError as e:
    return jsonify(format_error(e))

  item_id = Item.query.filter(Item.access_token == access_token).first().item_id
  add_transactions_to_user(transactions, user_id, item_id)
  
  # Note that we already pulled all transactions to date
  user = User.query.filter(User.user_id == user_id).first()
  set_last_pull_date(user, end_date)

def add_account_to_user(user_id, access_token):
    """ Adds accounts to user """
    try:
      accounts = client.Accounts.get(access_token)
    except plaid.errors.PlaidError as e:
      return jsonify(format_error(e))

    for account in accounts['accounts']:
      card = Card(account_id=account["account_id"], name=account["official_name"], available_balance=account["balances"]["current"], \
        last_four_digits=account["mask"], card_type=account["type"], user_id=user_id, item_id=accounts["item"]["item_id"])
      db.session.add(card)
      try:
        db.session.commit()
      except IntegrityError:
        db.session.rollback()

def add_transactions_to_user(transactions, user_id, item_id):
    for transaction in transactions:
        transaction_date = datetime.strptime(transaction['date'], '%Y-%m-%d')
        default_action_state = "archived"
        if transaction_date > (datetime.now() + timedelta(LAST_MONTH)):
          default_action_state = "untriaged"
        
        new_transaction = Transaction(card_id=transaction['account_id'], amount=float(transaction['amount']), category=transaction['category'][-1],
                                      name=transaction['name'], date=transaction_date, transaction_id=transaction['transaction_id'],
                                      action_state=default_action_state, image=transaction['category'][0]+".png", user_id=user_id, item_id = item_id)
        db.session.add(new_transaction)
        new_transaction.categorize_transaction()
    db.session.commit()
    find_subscriptions()

def is_item_new(user_id, access_token):
    """ Checks if item is unique """
    try:
      new_item_id = client.Accounts.get(access_token)["item"]["item_id"]
    except plaid.errors.PlaidError as e:
      return jsonify(format_error(e))

    items = Item.query.filter(Item.user_id == user_id)
    for item in items:
      if new_item_id == item.item_id:
        return False
    
    return True

def remove_item_from_user(user_id, item_id):
    """Remove item, access token and associated transactions for a user"""
    item = Item.query.filter(Item.user_id == user_id,
                             Item.item_id == item_id).first()
    access_token = item.access_token
    client.Item.remove(access_token)
    Transaction.query.filter(Transaction.item_id == item_id).delete()
    User.query.filter(User.user_id == user_id).update({ "last_pull" : None })
    
    db.session.delete(item)
    try:
      db.session.commit()
    except IntegrityError:
      db.session.rollback()
    return item

def get_items_for_user(user_id):
    """Get items for a user"""
    items_list = [item for item in Item.query.filter(
        Item.user_id == user_id).with_entities(Item.item_id, Item.item_name)]
    items = [{'item_id': item[0], 'item_name': item[1]} for item in items_list]
    return items

def get_last_months_transactions(user_id):
  return [transaction for transaction in Transaction.query.filter(Transaction.user_id == user_id).filter(Transaction.date >= (datetime.now() + timedelta(LAST_MONTH)))]

def get_updates_since_last_pull(last_pull):
    labels = ["refund", "return", "splittable", "subscription"]
    results_dict = {}
    for label in labels:
        results_dict[label] = {"amount": 0.00, "num": 0}
    for transaction in Transaction.query.filter(Transaction.date >= last_pull):
        label = transaction.label
        if label:
            results_dict[label]["amount"] += transaction.amount
            results_dict[label]["num"] += 1
            results_dict[label]["amount"] = round(
                results_dict[label]["amount"], 2)
    return results_dict

def get_start_date(user):
    """Either return the last pull date, or pull last 2 years"""
    if user.last_pull:
      start_date = user.last_pull.strftime('%Y-%m-%d')
    else:
      start_date = '{:%Y-%m-%d}'.format(datetime.now() + timedelta(LAST_TWO_YEARS))
    return start_date

def set_last_pull_date(user, last_pull_date):
    user.last_pull = datetime.strptime(last_pull_date, '%Y-%m-%d')
    db.session.commit()
    return user

def send_updates():
    """Schedules update email"""
    # users = User.query.all()
    # for user in users:
    #   start_date = get_start_date(user)
    #   updates = get_updates_since_last_pull(start_date)
    #   send_update_email(user.email, updates)

def write_access_token_to_file(access_token):
  """ Saves a copy of access tokens in a file separate from DB """
  with open('plaid_access_tokens.txt', 'w') as filehandle:  
    filehandle.write(access_token + "\n")

def send_update_email(email, updates):
    """Sends update email"""
    return requests.post(
        "https://api.mailgun.net/v3/" + MAILGUN_DOMAIN + "/messages",
        auth=("api", MAILGUN_API_KEY),
        data={
            "from": "Nimbus Updates <updates@" + MAILGUN_DOMAIN + ">",
            "to": [email],
            "subject": "Your weekly Nimbus updates are here",
            "text": "Hi there,\nsince you last checked Nimbus, you've received :\n" +
            str(updates["subscription"]["num"]) + " susbcriptions for $" + str(updates["subscription"]["amount"]) + "\n" +
            str(updates["refund"]["num"]) + " refunds for $" + str(updates["refund"]["amount"]) + "\n" +
            str(updates["return"]["num"]) + " returns for $" + str(updates["return"]["amount"]) + "\n" +
            str(updates["splittable"]["num"]) + " splittables for $" + str(updates["splittable"]["amount"]) + "\n" +
            "\nBest,\nNimbus team"
        })


scheduler = BackgroundScheduler()
scheduler.add_job(func=send_updates, trigger="interval", days=7)
scheduler.start()

# Shut down the scheduler when exiting the app
atexit.register(lambda: scheduler.shutdown())

def pretty_print_response(response):
    print(json.dumps(response, indent=2, sort_keys=True))

def format_error(e):
    return {'error': {'display_message': e.display_message, 'error_code': e.code, 'error_type': e.type, 'error_message': e.message}}

if __name__ == "__main__":
    app.run(debug=True)
    #app.run(host='0.0.0.0')
