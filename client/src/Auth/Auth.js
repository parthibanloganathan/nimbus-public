import auth0 from 'auth0-js';
import history from '../history';
import { AUTH_CONFIG } from '../keys/auth0-variables';

var redirectUriFromEnv;
if (process.env.NODE_ENV !== 'production') {
  // redirectUriFromEnv = 'http://localhost:3000/callback';
  redirectUriFromEnv = 'https://www.getnimbusapp.com/callback';
} else {
  redirectUriFromEnv = 'https://www.getnimbusapp.com/callback';
}

// See https://auth0.com/docs/quickstart/spa/react/01-login
// and https://auth0.com/docs/quickstart/spa/react/03-calling-an-api
export default class Auth {
  constructor() {
    this.accessToken = localStorage.getItem('nimbusAccessToken');
    this.idToken = localStorage.getItem('nimbusIdToken');
    this.expiresAt = localStorage.getItem('nimbusExpiresAt');
    this.userId = localStorage.getItem('nimbusUserId');
  }

  auth0 = new auth0.WebAuth({
    domain: AUTH_CONFIG.domain,
    clientID: AUTH_CONFIG.clientID,
    redirectUri: redirectUriFromEnv,
    audience: AUTH_CONFIG.audience,
    responseType: 'token id_token',
    scope: 'openid email'
  });

  accessToken;
  idToken;
  expiresAt;
  userId;

  handleAuthentication = () => {
    this.auth0.parseHash((err, authResult) => {
      if (authResult && authResult.accessToken && authResult.idToken) {
        this.setSession(authResult);
      } else if (err) {
        history.replace('/');
        console.log(err);
        alert(`Error: ${err.error}. Check the console for further details.`);
      }
    });
  }

  getAuth = () => {
    return this.auth0;
  }

  getAccessToken = () => {
    return this.accessToken;
  }

  getIdToken = () => {
    return this.idToken;
  }

  getExpirationTime = () => {
    return this.expiresAt;
  }

  setSession(authResult) {
    // Set the time that the access token will expire at
    let expiresAt = (authResult.expiresIn * 1000) + new Date().getTime();
    this.accessToken = authResult.accessToken;
    this.idToken = authResult.idToken;
    this.expiresAt = expiresAt;

    // Set isLoggedIn flag in localStorage
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('nimbusAccessToken', this.accessToken);
    localStorage.setItem('nimbusIdToken', this.idToken);
    localStorage.setItem('nimbusExpiresAt', this.expiresAt);

    // Navigate to the home route
    history.replace('/home');
  }

  renewSession = () => {
    this.auth0.checkSession({}, (err, authResult) => {
      if (authResult && authResult.accessToken && authResult.idToken) {
        this.setSession(authResult);
      } else if (err) {
        this.logout();
        console.log(err);

        // navigate to the home route
        history.replace('/');
        alert(`You've been logged out. Log in again to continue`);
      }
    });
  }

  login = () => {
    this.auth0.authorize();
  }

  logout = () => {
    // Remove tokens and expiry time
    this.accessToken = null;
    this.idToken = null;
    this.expiresAt = 0;

    // Remove isLoggedIn flag from localStorage
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('nimbusAccessToken');
    localStorage.removeItem('nimbusIdToken');
    localStorage.removeItem('nimbusExpiresAt');
    localStorage.removeItem('nimbusUserId');
    localStorage.removeItem('nimbusUserEmail');

    this.auth0.logout({
      return_to: "https://wwww.getnimbusapp.com"
    });

    // navigate to the home route
    history.replace('/');
  }

  isAuthenticated = () => {
    // Check whether the current time is past the
    // access token's expiry time
    let expiresAt = this.expiresAt;

    if (expiresAt) {
      return new Date().getTime() < expiresAt;
    }

    return false;
  }
}
