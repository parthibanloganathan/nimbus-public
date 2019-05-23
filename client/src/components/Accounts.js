import React, { Component, Fragment } from 'react';
import withStyles from '@material-ui/core/styles/withStyles';
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';
import Link from '@material-ui/icons/Link';

const styles = theme => ({
    icon: {
        verticalAlign: "middle",
        color: "#4A4A4A"
    },
    account: {
        paddingBottom: "1em",
        borderBottom: "1px solid #d8d8d8",
        "&:last-child": {
            borderBottom: "0px",
        }
    },
    link: {
        fontSize: "0.7em",
        marginLeft: "1em"
    }
});

class Accounts extends Component {
    render() {
        const { classes, accounts } = this.props;
       
        if (!accounts) {
            return null;
        }
        
        return (
            <Fragment>
                <Typography>
                    <Link className={classes.icon} />
                    Linked
                    < a href="/settings" className={classes.link} > Add Account</a >
                </Typography>
                {
                    accounts.map(account =>
                        <div className={classes.account} key={account.name}>
                            <br />
                            <Typography><b>{account.name}</b></Typography>
                            <Typography>****{account.last_four_digits}</Typography>
                            <Typography>${account.available_balance}</Typography>
                        </div>
                    )
                }
            </Fragment>
        )
    }
}

Accounts.propTypes = {
    accounts: PropTypes.array.isRequired
}

export default withStyles(styles)(Accounts);