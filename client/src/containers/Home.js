import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { fetchAndStoreUserId, setAuthTokens } from '../actions/authActions';
import { fetchTransactions } from '../actions/transactionActions';
import { fetchPlaidItems } from '../actions/plaidActions';
import Auth from '../Auth/Auth';
import Plaid from '../components/Plaid';
import Accounts from '../components/Accounts';
import Loading from '../components/Loading';
import withStyles from '@material-ui/core/styles/withStyles';
import SearchAppBar from '../components/SearchAppBar';
import Categories from '../components/Categories';
import Grid from '@material-ui/core/Grid';
import CssBaseline from '@material-ui/core/CssBaseline';

const styles = theme => ({
  root: {
    flexGrow: 1,
    overflow: 'hidden',
    backgroundColor: "white",
    width: "100%",
    boxShadow: "0px 1px 5px 0px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 3px 1px -2px rgba(0,0,0,0.12)",
    margin: '0 auto',
    minHeight: "100vh"
  },
  headers: {
    fontSize: "1.1em",
    fontWeight: "bold",
    paddingTop: "1.5em",
    paddingBottom: "1em",
    color: "#4A4A4A",
    lineHeight: "100%"
  },
  icon: {
    verticalAlign: "middle",
    paddingRight: 4
  },
  paper: {
    padding: '20px',
    textAlign: 'center',
    [theme.breakpoints.down('md')]: {
      padding: '5px',
      margin: '5px 5px 5px 5px'
    },
  },
  button: {
    marginTop: "1em"
  },
  updateHeader: {
    marginBottom: "0.5em",
    fontSize: "1.1em",
    fontWeight: "bold"
  },
  cardContainer: {
    border: "1px solid #d8d8d8d8",
    height: "100%",
    borderRadius: "3px",
    padding: "20px",
    [theme.breakpoints.down('sm')]: {
      display: "none",
    }
  },
  transactionsContainer: {
    margin: '0 auto',
    [theme.breakpoints.down('sm')]: {
      paddingLeft: "0"
    }
  }
});

class Home extends Component {
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
      this.props.dispatch(fetchTransactions(this.props.userId, this.props.accessToken));
      this.props.dispatch(fetchPlaidItems(this.props.userId, this.props.accessToken));
      this.setState({ fetched: true });
    }
  }

  render() {
    const { classes, plaidItems, userId, accessToken, transactions, loading, accounts, intro_seen } = this.props;

    if (loading) {
      return <Loading />;
    }

    return (
      <Fragment>
        <CssBaseline />
        <SearchAppBar />
        {Object.keys(plaidItems).length > 0 ?
          <div className={classes.root}>
            <Grid container>
              <Grid item xs={12} md={2} className={classes.cardContainer}>
                <Accounts accounts={accounts} />
              </Grid>
              <Grid item xs={12} md={10} className={classes.transactionsContainer}>
                <Categories userId={userId} accessToken={accessToken} transactions={transactions} intro_seen={intro_seen} />
              </Grid>
            </Grid>
          </div>
          :
          <Plaid plaidItems={plaidItems} accessToken={accessToken} userId={userId} />}
      </Fragment>
    );
  }
}

const mapStateToProps = state => {
  return {
    transactions: state.transactions.items,
    loading: state.transactions.loading,
    updates: state.transactions.updates,
    accounts: state.transactions.accounts,
    plaidItems: state.plaid.plaidItems || {},
    userId: state.auth.userId,
    accessToken: state.auth.accessToken,
    intro_seen: state.transactions.user
  }
};

export default connect(mapStateToProps)(withStyles(styles)(Home));