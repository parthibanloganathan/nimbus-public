import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { fetchPlaidItems } from '../actions/plaidActions';
import { fetchAndStoreUserId, setAuthTokens } from '../actions/authActions';
import Plaid from '../components/Plaid';
import withStyles from '@material-ui/core/styles/withStyles';
import SearchAppBar from '../components/SearchAppBar';
import CssBaseline from '@material-ui/core/CssBaseline';
import Auth from '../Auth/Auth'
import Loading from '../components/Loading';

const styles = theme => ({
    root: {
        flexGrow: 1,
        paddingTop: "2em",
        width: "100%",
        paddingLeft: "15%",
        paddingRight: "15%",
        margin: '0 auto'
    }
});

class Settings extends Component {
    constructor(props) {
        super(props)
        this.state = {
            isUserSaved: false,
            fetched: false
        }
    }

    componentDidMount() {
        const auth = new Auth();

        if (auth.getAccessToken() == null) {
            this.props.auth.logout();
            this.setState({ isAuthenticated: this.props.auth.isAuthenticated() });
            this.props.history.push("/");
        }

        if (this.props.userId === null || this.props.accessToken === null) {
            this.props.dispatch(setAuthTokens(auth.getAccessToken(), auth.getIdToken(), auth.getExpirationTime()));
            this.props.dispatch(fetchAndStoreUserId(auth.getAuth(), auth.getAccessToken(), () => {
                this.setState({ isUserSaved: true });
            }));
        }
    }

    componentDidUpdate() {
        if (this.props.userId !== null && this.state.isUserSaved === true && this.state.fetched === false) {
            this.props.dispatch(fetchPlaidItems(this.props.userId, this.props.accessToken));
            this.setState({ fetched: true });
        }
    }

    render() {
        const { classes, plaidItems, accessToken, userId, loading } = this.props;

        if (loading) {
            return <Loading />;
        }

        return (
            <Fragment>
                <CssBaseline />
                <SearchAppBar />
                {plaidItems && accessToken && userId &&
                    <div className={classes.root}>
                        <Plaid plaidItems={plaidItems} accessToken={accessToken} userId={userId} />
                    </div >
                }
            </Fragment >
        );
    }
}

const mapStateToProps = state => {
    return {
        plaidItems: state.plaid.plaidItems,
        userId: state.auth.userId,
        accessToken: state.auth.accessToken,
        loading: state.plaid.loading
    }
};

export default connect(mapStateToProps)(withStyles(styles)(Settings));