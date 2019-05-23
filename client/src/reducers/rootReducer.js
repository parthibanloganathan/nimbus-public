import { combineReducers } from 'redux';
import transactions from './transactionReducer';
import auth from './authReducer';
import plaid from './plaidReducer';

export default combineReducers({
    auth,
    plaid,
    transactions
});
