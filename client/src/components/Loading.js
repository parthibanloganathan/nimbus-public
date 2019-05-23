import React, { Component, Fragment } from 'react';
import Typography from '@material-ui/core/Typography';
import withStyles from '@material-ui/core/styles/withStyles';
import { Animated } from "react-animated-css";

const styles = theme => ({
    root: {
        backgroundColor: "#4285F4",
        minHeight: "100vh",
        textAlign: "center"
    },
    callout: {
        fontSize: "1.3em",
        color: "white",
        fontWeight: "bold",
        textAlign: "center",
        paddingTop: "15vh"
    },
    subTitle: {
        marginTop:"1em",
        color: "white",
        textAlign: "center",
    },
    cloud: {
        margin: "auto",
        maxWidth: "300px",
        paddingTop: "4em",
        textAlign: "center"
    }
});

class Loading extends Component {
    render() {
        const { classes } = this.props;
        return (
            <Fragment>
                <div className={classes.root}>
                    <Typography className={classes.callout}> Hold on tight! </Typography>
                    <Typography className={classes.subTitle}> Grabbing your latest purchases</Typography>
                    <Animated animationIn="bounce infinite" isVisible={true}>
                    <img src="./cloud.png" className={classes.cloud} alt="loading cloud"></img>
                    </Animated> 
                </div>
            </Fragment>
        )
    }
}

export default withStyles(styles)(Loading);
