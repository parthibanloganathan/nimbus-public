import { parseIdFromAuthZero } from '../Utils/UserManagement';
import history from '../history';
import { callServer } from '../Utils/NetworkUtils';

export const SET_ACCESS_TOKEN = 'SET_ACCESS_TOKEN';
export const SET_ID_TOKEN = 'SET_ID_TOKEN';
export const SET_EXPIRATION_TIME = 'SET_EXPIRATION_TIME';
export const SET_USER_ID = 'SET_USER_ID';

export const setAccessToken = accessToken => ({
    type: SET_ACCESS_TOKEN,
    payload: { accessToken }
});

export const setIdToken = idToken => ({
    type: SET_ID_TOKEN,
    payload: { idToken }
});

export const setExpirationTime = expirationTime => ({
    type: SET_EXPIRATION_TIME,
    payload: { expirationTime }
});

export const setUserId = userId => ({
    type: SET_USER_ID,
    payload: { userId }
});

export const fetchAndStoreUserId = (auth, accessToken, onUserCreated) => dispatch => {
    auth.client.userInfo(accessToken, (err, user) => {
        if (err) {
            console.log(err);
            auth.logout();
            history.push('/');
        }
        const userId = parseIdFromAuthZero(user["sub"]);
        const userEmail = user["email"];
        localStorage.setItem('userId', userId);
        localStorage.setItem('userId', userEmail);

        callServer('new_user', userId, accessToken, {
            "user_email": userEmail
        }, (response) => {
            onUserCreated();
        });

        // Identify user in Fullstory
        window.FS.identify(userId, {
            email: userEmail
        });

        dispatch(setUserId(userId));
    })
}

export const setAuthTokens = (accessToken, idToken, expirationTime) => dispatch => {
    dispatch(setAccessToken(accessToken));
    dispatch(setIdToken(idToken));
    dispatch(setExpirationTime(expirationTime));
}

