import Auth from '../Auth/Auth'

import { fetchPlaidItems } from '../actions/plaidActions';
import { fetchTransactions } from '../actions/transactionActions';

export function refetch(userId, accessToken, dispatch) {
  dispatch(fetchPlaidItems(userId, accessToken));
  dispatch(fetchTransactions(userId, accessToken));
}

export function parseIdFromAuthZero(authZeroId) {
  return authZeroId.split("|")[1];
}

export function isLoggedIn () {
  const auth = new Auth();
  if (auth.isAuthenticated()) {
    return true;
  }
  return false;
}