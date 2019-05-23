import React, { Component } from 'react'
import PlaidLink from 'react-plaid-link'
import Button from '@material-ui/core/Button';
import PropTypes from 'prop-types'
import { connect } from 'react-redux';
import { removePlaidItem } from '../actions/plaidActions';
import { refetch } from '../Utils/UserManagement'
import { callServer } from '../Utils/NetworkUtils'
import { Typography } from '@material-ui/core';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import Paper from "@material-ui/core/Paper";
import withStyles from '@material-ui/core/styles/withStyles';
import { fetchTransactionsBegin } from '../actions/transactionActions'
import { PLAID_CONFIG } from '../keys/plaid-variables';

const styles = theme => ({
  plaid: {
    padding: 30,
    margin: '0 auto'
  },
  paper: {
    padding: 20,
    textAlign: 'center',
    [theme.breakpoints.down('md')]: {
      padding: '5px',
      margin: '5px 5px 5px 5px'
    },
  },
  accounts: {
    margin: 20
  },
  cloud: {
    margin: "auto",
    maxWidth: "200px"
  },
  noAccounts: {
    textAlign: "center",
    padding: "2em",
    marginTop: "1em",
    backgroundColor: "#FCFADF"
  }
});

class Plaid extends Component {
  handleOnSuccess = (publicToken, metadata) => {
    this.props.dispatch(fetchTransactionsBegin());
    callServer('get_access_token', this.props.userId, this.props.accessToken, {
      'public_token': publicToken,
      'item_name': metadata.institution.name
    }, () => {
      refetch(this.props.userId, this.props.accessToken, this.props.dispatch);
    });
  }

  removeItem = (itemId) => {
    callServer('remove_item', this.props.userId, this.props.accessToken, {
      'item_id': itemId
    }, () => {
      this.props.dispatch(removePlaidItem(itemId));
    });
  }

  render() {
    const { plaidItems, classes } = this.props;
    let accounts;

    if (Object.keys(plaidItems).length === 0) {
      accounts = <Typography>No accounts. Securely link a bank to get started.</Typography>;
    } else {
      accounts = <List>
        {Object.entries(plaidItems).map(item =>
          <ListItem
            key={item[0]}
          >
            <ListItemText
              primary={item[1]}
            />
            <ListItemSecondaryAction>
              <Button onClick={() => this.removeItem(item[0])}>Remove</Button>
            </ListItemSecondaryAction>
          </ListItem>
        )}
      </List>;
    }

    return (
      <div className={classes.plaid}>
        <Paper className={classes.paper}>
          <Typography variant="h6">Connected Accounts</Typography>
          <div className={classes.accounts}>
            {accounts}
          </div>
          <PlaidLink
            clientName="Nimbus"
            env={PLAID_CONFIG.env}//{process.env.PLAID_ENV}
            apiVersion={'v2'}
            product={["transactions"]}
            publicKey={PLAID_CONFIG.publicKey}//{process.env.PLAID_PUBLIC_KEY}
            onExit={this.handleOnExit}
            onSuccess={this.handleOnSuccess}
            style={{ all: 'none', border: 'none' }}>
            <Button variant="contained" color="secondary">Add a bank account</Button>
          </PlaidLink>
        </Paper>
      </div>
    )
  }
}

Plaid.propTypes = {
  plaidItems: PropTypes.object.isRequired,
  userId: PropTypes.string.isRequired,
  accessToken: PropTypes.string.isRequired
}

export default connect()(withStyles(styles)(Plaid));
