import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types'
import withStyles from '@material-ui/core/styles/withStyles';
import Box from '@material-ui/icons/LocalShipping';
import Repeat from '@material-ui/icons/Repeat';
import CallSplit from '@material-ui/icons/CallSplit';
import New from '@material-ui/icons/NewReleases';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import Paper from "@material-ui/core/Paper";
import Button from '@material-ui/core/Button';

const styles = theme => ({
    categories: {
        marginTop: 30
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
        padding: 20,
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
    }
});

class Updates extends Component {
    render() {
        const { loading, updates, classes } = this.props;

        if (loading) {
            return <div>Loading...</div>;
        }

        if (!updates) {
            return null;
        }

        return (
            <Fragment>
                <Typography variant="h4" className={classes.headers}><New className={classes.icon} />What's New</Typography>
                <Grid container spacing={16}>

                    {updates.subscription.num > 0 && <Grid item xs="12" md="3">
                        <Paper className={classes.paper}>
                            <Typography className={classes.updateHeader}> <Repeat className={classes.icon} /> ${updates.subscription.amount} </Typography>
                            <Typography>
                                You have {updates.subscription.num} new subscriptions totalling ${updates.subscription.amount}
                            </Typography>
                            <Button
                                variant="contained"
                                className={classes.button}>
                                Manage
                            </Button>
                        </Paper>
                    </Grid>}

                    {updates.return.num > 0 && <Grid item xs="12" md="3">
                        <Paper className={classes.paper}>
                            <Typography className={classes.updateHeader}> <Box className={classes.icon} /> ${updates.return.amount} </Typography>
                            <Typography>
                                You have {updates.return.num} new items that you could return totalling ${updates.return.amount}
                            </Typography>
                            <Button
                                variant="contained"
                                className={classes.button}>
                                Manage
                            </Button>
                        </Paper>
                    </Grid>}

                    {updates.refund.num > 0 && <Grid item xs="12" md="3">
                        <Paper className={classes.paper}>
                            <Typography className={classes.updateHeader}> <New className={classes.icon} /> ${updates.refund.amount} </Typography>
                            <Typography>
                                You have {updates.refund.num} new refunds totalling ${updates.refund.amount}
                            </Typography>
                            <Button
                                variant="contained"
                                className={classes.button}>
                                Manage
                            </Button>
                        </Paper>
                    </Grid>}

                    {updates.splittable.num > 0 && <Grid item xs="12" md="3">
                        <Paper className={classes.paper}>
                            <Typography className={classes.updateHeader}> <CallSplit className={classes.icon} /> ${updates.splittable.amount} </Typography>
                            <Typography>
                                You have {updates.splittable.num} new potential bills to split totalling ${updates.splittable.amount}
                            </Typography>
                            <Button
                                variant="contained"
                                className={classes.button}>
                                Manage
                            </Button>
                        </Paper>
                    </Grid>}

                </Grid>
            </Fragment>
        )
    }
}

Updates.propTypes = {
    updates: PropTypes.object.isRequired
}

export default withStyles(styles)(Updates);