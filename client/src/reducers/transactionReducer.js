import {
    FETCH_TRANSACTIONS_BEGIN,
    FETCH_TRANSACTIONS_SUCCESS,
    UPDATE_TRANSACTIONS
} from '../actions/transactionActions.js';

const initialState = {
    items: [],
    loading: true,
    error: null
};

export default function transactionReducer(state = initialState, action) {
    switch (action.type) {
        case FETCH_TRANSACTIONS_BEGIN:
            return {
                ...state,
                loading: true
            };

        case FETCH_TRANSACTIONS_SUCCESS:
            return {
                ...state,
                loading: false,
                items: action.payload.transactions,
                updates: action.payload.updates, 
                accounts: action.payload.accounts,
                user: action.payload.user
            };

        case UPDATE_TRANSACTIONS:
            let transactions = [...state.items];

            action.payload.newTransactions.forEach(newTransaction => {
                var replaceIndex = transactions.findIndex(transaction => {
                    return transaction.transaction_id === newTransaction.transaction_id;
                });
                transactions[replaceIndex] = newTransaction; 
            });

            return {
                ...state,
                items: transactions
            };

        default:
            return state;
    }
}