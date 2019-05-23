import React, { Component, Fragment } from 'react';
import Button from '@material-ui/core/Button';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';

class Login extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isAuthenticated: props.auth.isAuthenticated()
        }
    }

    login = () => {
        this.props.auth.login();
        this.props.history.push("/home");
    }

    logout = () => {
        this.props.auth.logout();
        this.setState({ isAuthenticated: this.props.auth.isAuthenticated() });
        this.props.history.push("/");
    }

    componentDidMount() {
        this.props.auth.login();
        this.props.history.push("/home");

        const { renewSession } = this.props.auth;

        if (localStorage.getItem('isLoggedIn') === 'true') {
            renewSession();
        }
    }

    render() {
        let button;
        if (this.state.isAuthenticated) {
            button = <Button variant="contained" onClick={this.logout}>Log Out</Button>
        } else {
            button = <Button variant="contained" onClick={this.login}>Log In</Button>
        }

        return (
            <Fragment>
            </Fragment>
        )
    }
}

Login.propTypes = {
    auth: PropTypes.object.isRequired
}

export default withRouter(Login);