from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from difflib import SequenceMatcher
from datetime import date
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import validates
from sqlalchemy import desc
from datetime import datetime, timedelta
from flaskapp import app

db = SQLAlchemy(app)

MERCHANTS = {"macys": "https://www.macys.com/purchases",
"amazon": "https://www.amazon.com/orders",
"ebay": "https://www.ebay.com/help/buying/returns-refunds/return-item-refund?id=4041",
"target": "https://www.target.com/account/orders",
"costco": "https://www.costco.com/OrderStatusCmd",
"kohls": "https://www.kohls.com/myaccount/v2/order-history.jsp",
"sears": "https://www.sears.com/universalprofile/myorderstatus",
"jcrew": "https://www.jcrew.com/r/account/order-history",
"zappos": "https://www.zappos.com/account",
"nordstrom": "https://secure.nordstrom.com/my-account",
"jet.com": "https://jet.com/account/orders",
"bestbuy": "https://www-ssl.bestbuy.com/profile/ss/orderlookup",
"wish": "https://www.wish.com/search/my-orders",
"walmart": "https://www.walmart.com/account"}

ONE_YEAR_AGO = -365

def similar(a, b):
    return SequenceMatcher(None, a, b).ratio()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(128), unique = True, index = True)
    email = db.Column(db.String(128))
    name = db.Column(db.String(64))
    last_pull = db.Column(db.DateTime)
    intro_seen = db.Column(db.Boolean, default = False)

    def __repr__(self):
        return '<User {}>'.format(self.user_id)

    def as_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}  

class Item(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(128), db.ForeignKey('user.user_id'),
        nullable=True)
    access_token = db.Column(db.String(128))
    item_name = db.Column(db.String(64))
    item_id = db.Column(db.String(64), unique = True) 

    def __repr__(self):
        return '<Item {}>'.format(self.item_name)  

    def as_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}  

class Subscription(db.Model):
    id = db.Column(db.Integer, primary_key = True, unique = True)
    name = db.Column(db.String(128))
    count = db.Column(db.Integer)

class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key = True)
    user_id = db.Column(db.String(128), db.ForeignKey('user.user_id'),
        nullable=True)
    card_id = db.Column(db.String(128), db.ForeignKey('card.account_id'),
        nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey('company.id'),
        nullable=True)
    item_id = db.Column(db.String(64), db.ForeignKey('item.item_id'))
    amount = db.Column(db.Float)
    date = db.Column(db.DateTime)
    name = db.Column(db.String(128))
    category = db.Column(db.String(128))
    image = db.Column(db.String(128))
    transaction_id = db.Column(db.String(128), index=True, unique=True)
    label = db.Column(db.String(128))
    refunded = db.Column(db.Boolean())
    action_state = db.Column(db.String(128))
    return_link = db.Column(db.String(128))

    @validates('name')
    def validate_code(self, key, value):
        max_len = getattr(self.__class__, key).prop.columns[0].type.length
        if value and len(value) > max_len:
            return value[:max_len]
        return value

    def categorize_transaction(self):
        try:
            if self.is_splittable():
                return
            elif self.is_returnable():
                return 
            else: 
                db.session.commit()
        except IntegrityError:
            db.session.rollback()

    def is_refund(self):
        if self.amount < 0 and self.category != "Credit":
            self.label = "refund"
            db.session.commit()
            return True
        return False

    def is_returnable(self):
        merchant_name = self.name.lower()
        for merchant in MERCHANTS.keys():
            merchant_length = len(merchant)
            if similar(merchant_name[:merchant_length+3], merchant) > 0.8 and self.date > (datetime.now() + timedelta(ONE_YEAR_AGO)):
                self.label = "return"
                self.return_link = MERCHANTS[merchant]
                db.session.commit()
                return True
        return False

    def is_splittable(self):
        if self.category and self.category == "Restaurants" and self.amount > 35:
            self.label = "splittable"
            db.session.commit()
            return True
        return False

    def as_dict(self):
        json_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}
        json_dict["date"] = str('{:%m-%d-%y}'.format(self.date))
        return json_dict


class Card(db.Model):
    id = db.Column(db.Integer, primary_key = True)
    account_id = db.Column(db.String(128), index=True, unique=True)
    name = db.Column(db.String(128))
    last_four_digits = db.Column(db.String(4))
    available_balance = db.Column(db.Float())
    card_type = db.Column(db.String(50))
    user_id = db.Column(db.String(128), db.ForeignKey('user.user_id'))
    item_id = db.Column(db.String(64), db.ForeignKey('item.item_id')) 

    def as_dict(self):
        json_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}
        return json_dict

class Company(db.Model):
    id = db.Column(db.Integer, primary_key = True, unique = True)
    return_policy = db.Column(db.String(150))
    return_length = db.Column(db.Integer)
    subscription_page = db.Column(db.String(150))
    company_type = db.Column(db.String(150))

"""Preparing a many to many relationship for users and interests and deals and interests"""
class Deals(db.Model):
    id = db.Column(db.Integer, primary_key = True)
    discount_text = db.Column(db.String(128))
    link = db.Column(db.String(128))
    promo_code = db.Column(db.String(128))
    company_name = db.Column(db.String(128))
    company_logo_path = db.Column(db.String(256)) 

class Interests(db.Model):
    id = db.Column(db.Integer, primary_key = True)
    name = db.Column(db.String())

def find_subscriptions():
    """ Find all subscriptions in transaction history """
    transactions = [transaction for transaction in Transaction.query.order_by(desc(Transaction.date)).all()]
    weekly_subs = {}
    monthly_subs = {}
    annual_subs = {}
    last_seen = {}
    subscriptions = []

    for transaction in transactions:
        if transaction.name in last_seen:
            # if(transaction.name == "DIGITALOCEAN.COM"):
            #     print("Seeing DIGITALOCEAN.COM again on ", transaction.date.strftime("%Y-%m-%d"))
            last_transaction = last_seen[transaction.name]
            if transaction.amount == last_transaction.amount:
                add_to_hist(transaction, last_transaction, weekly_subs, monthly_subs, annual_subs)
        else:
            # if(transaction.name == "DIGITALOCEAN.COM"):
            #     print("First saw DIGITALOCEAN.COM for ", transaction.date.strftime("%Y-%m-%d"))
            last_seen[transaction.name] = transaction
            weekly_subs[transaction.name] = 0
            monthly_subs[transaction.name] = 0
            annual_subs[transaction.name] = 0
        
        last_seen[transaction.name] = transaction

    true_weekly_subs = [k for k, v in weekly_subs.items() if v > 4]
    subscriptions = true_weekly_subs + get_non_zero_keys_from_hist(monthly_subs) + get_non_zero_keys_from_hist(annual_subs)

    for subscription_name in subscriptions:
      transaction = Transaction.query.filter(Transaction.name == subscription_name).update({"label": "subscription"})

    try:
      db.session.commit()
    except IntegrityError:
      db.session.rollback()


def get_non_zero_keys_from_hist(hist):
    """ Returns keys for all elements with non-zero value """
    return [k for k, v in hist.items() if v != 0]

def add_to_hist(transaction, last_transaction, weekly_subs, monthly_subs, annual_subs):
    """ If transactions look like they could be subscriptions, add to appropriate bucket of histogram """
    delta = last_transaction.date - transaction.date

    # Only consider recent transactions for weekly and monthly subscriptions
    if (datetime.now() - transaction.date).days < 90:
        # Weekly subscriptions are 6-8 days apart
        if delta.days == 6 or delta.days == 7 or delta.days == 8:
            weekly_subs[transaction.name] += 1
            return

        # Monthly subscriptions happen on same day of the month in adjacent months
        if last_transaction.date.strftime('%d') == transaction.date.strftime('%d') and delta.days > 27 and delta.days < 32:
            monthly_subs[transaction.name] += 1
    
    else:
        if last_transaction.date.strftime('%d') == transaction.date.strftime('%d') and delta.days > 363 and delta.days < 367:
            annual_subs[transaction.name] += 1
