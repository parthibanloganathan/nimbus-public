import axios from 'axios';

var serverUrl;
if (process.env.NODE_ENV !== 'production') {
    // serverUrl = 'http://localhost:8000/';
    serverUrl = 'https://nimbus-server-2.herokuapp.com/';
} else {
    serverUrl = 'https://nimbus-server-2.herokuapp.com/';
}

export function callServer(endpoint, userId, accessToken, body, onSuccess) {
    const headers = { 'Authorization': `Bearer ${accessToken}`};
    axios.post(serverUrl + endpoint, {
        'user_id': userId,
        ...body
    }, { headers: headers }).then(response => {
        console.log(response);
        onSuccess(response);
    }).catch(error => console.log(error));
}
