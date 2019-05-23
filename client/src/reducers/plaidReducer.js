import {
    FETCH_PLAID_ITEMS_BEGIN,
    ADD_PLAID_ITEM,
    REMOVE_PLAID_ITEM
} from '../actions/plaidActions.js';

const initialState = {
    plaidItems: {}
};

export default function plaidReducer(state = initialState, action) {
    let plaidItems;
    switch (action.type) {
        case FETCH_PLAID_ITEMS_BEGIN:
        return {
            ...state,
            loading: true
        };

        case ADD_PLAID_ITEM:
            plaidItems = { ...state.plaidItems };
            plaidItems[action.payload.itemId] = action.payload.itemName;
            return {
                ...state,
                plaidItems,
                loading: false
            };

        case REMOVE_PLAID_ITEM:
            plaidItems = { ...state.plaidItems };
            delete plaidItems[action.payload.itemId]
            return {
                ...state,
                plaidItems
            };

        default:
            return state;
    }
}