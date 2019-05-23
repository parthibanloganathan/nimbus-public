import {
    SET_ACCESS_TOKEN,
    SET_ID_TOKEN,
    SET_EXPIRATION_TIME,
    SET_USER_ID
} from '../actions/authActions.js';

const initialState = {
    accessToken: null,
    idToken: null,
    expirationTime: null,
    userId: null
};

export default function authReducer(state = initialState, action) {
    switch (action.type) {
        case SET_ACCESS_TOKEN:
            return {
                ...state,
                accessToken: action.payload.accessToken
            };

        case SET_ID_TOKEN:
            return {
                ...state,
                idToken: action.payload.idToken
            };

        case SET_EXPIRATION_TIME:
            return {
                ...state,
                expirationTime: action.payload.expirationTime
            };

        case SET_USER_ID:
            return {
                ...state,
                userId: action.payload.userId
            };

        default:
            return state;
    }
}