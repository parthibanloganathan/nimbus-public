import React, { Component } from 'react';
import { Provider } from 'react-redux';
import { Route, Router, Switch } from 'react-router-dom';
import LandingPage from './LandingPage';
import Login from '../components/Login'
import Home from './Home'
import Settings from './Settings'
import Callback from '../components/Callback';
import Auth from '../Auth/Auth';
import configureStore from '../store';
import history from '../history';
import {MuiThemeProvider, createMuiTheme} from '@material-ui/core/styles';

const theme = createMuiTheme({
  palette: {
    secondary: {
      main: '#f44336'//"#ff1744"
    },
    primary: {
      main: '#4285F4'//'#A8DAE1'
    }
  },
  typography: {
    fontFamily: "'Montserrat', sans-serif; font-weight:400",
    useNextVariants: true
  }
});

const auth = new Auth();

const handleAuthentication = ({ location }) => {
    if (/access_token|id_token|error/.test(location.hash)) {
        auth.handleAuthentication();
    }
}

class Root extends Component {
    render() {
        return (
            <MuiThemeProvider theme={theme}>
            <Provider store={configureStore()}>
                <Router history={history}>
                    <div>
                        <Switch>
                            <Route exact path="/" component={LandingPage} />
                            <Route path="/login" render={(props) => <Login auth={auth} {...props} />} />
                            <Route path="/home" component={Home} />
                            <Route path="/settings" component={Settings} />
                            <Route path="/callback" render={(props) => {
                                handleAuthentication(props);
                                return <Callback auth={auth} {...props} />
                            }} />
                        </Switch>
                    </div>
                </Router>
            </Provider>
            </MuiThemeProvider>
        )
    }
}

export default Root;


