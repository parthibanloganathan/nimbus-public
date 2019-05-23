import { callServer } from '../Utils/NetworkUtils'

export const FETCH_TRANSACTIONS_BEGIN = 'FETCH_TRANSACTIONS_BEGIN';
export const FETCH_TRANSACTIONS_SUCCESS = 'FETCH_TRANSACTIONS_SUCCESS';
export const UPDATE_TRANSACTIONS = 'UPDATE_TRANSACTIONS';

export const fetchTransactionsBegin = () => ({
    type: FETCH_TRANSACTIONS_BEGIN
});

const updateTransactionsInStore = (newTransactions) => ({
    type: UPDATE_TRANSACTIONS,
    payload: { newTransactions }
})

const fetchTransactionsSuccess = (transactions, updates, accounts, user) => ({
    type: FETCH_TRANSACTIONS_SUCCESS,
    payload: {
        "transactions": transactions,
        "updates": updates, 
        "accounts": accounts,
        "user": user
    }
});

export const fetchTransactions = (userId, accessToken) => dispatch => {
    dispatch(fetchTransactionsBegin());

    callServer('fetch_user_data', userId, accessToken, {}, (response) => {
        let transactions = response.data.transactions;
        let updates = response.data.updates;
        let accounts = response.data.accounts;
        let user = response.data.user;
        console.log(user);
        if (transactions) {
            dispatch(fetchTransactionsSuccess(transactions, updates, accounts, user));
        }
    });
}

export const updateTransactions = (userId, accessToken, transactionsToChange) => dispatch => {
    dispatch(updateTransactionsInStore(transactionsToChange));

    callServer('update_transactions', userId, accessToken, {
        'new_transactions': transactionsToChange
    }, () => {});
}