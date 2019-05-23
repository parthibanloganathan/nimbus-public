import { callServer } from '../Utils/NetworkUtils'

export const FETCH_PLAID_ITEMS_BEGIN = 'FETCH_PLAID_ITEMS_BEGIN';
export const ADD_PLAID_ITEM = 'ADD_PLAID_ITEM';
export const REMOVE_PLAID_ITEM = 'REMOVE_PLAID_ITEM';

export const fetchPlaidItemsBegin = () => ({
    type: FETCH_PLAID_ITEMS_BEGIN
});

export const addPlaidItem = (itemId, itemName) => ({
    type: ADD_PLAID_ITEM,
    payload: {
        "itemId": itemId,
        "itemName": itemName
    }
});

export const removePlaidItem = (itemId) => ({
    type: REMOVE_PLAID_ITEM,
    payload: {
        "itemId": itemId
    }
});

export const fetchPlaidItems = (userId, accessToken) => dispatch => {
    dispatch(fetchPlaidItemsBegin());
    callServer('get_items', userId, accessToken, {}, (response) => {
        let items = response.data.items;
        for (var i in items) {
            dispatch(addPlaidItem(items[i].item_id, items[i].item_name));
        }
    });
}
