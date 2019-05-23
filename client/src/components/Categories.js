import React, { Component } from 'react';
import { callServer } from '../Utils/NetworkUtils';
import withStyles from '@material-ui/core/styles/withStyles';
import AccountBalance from '@material-ui/icons/AccountBalance';
import Repeat from '@material-ui/icons/Repeat';
import CallSplit from '@material-ui/icons/CallSplit';
import Box from '@material-ui/icons/LocalShipping';
import New from '@material-ui/icons/NewReleases';
import TransactionsList from './TransactionsList';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';
import Inbox from '@material-ui/icons/AllInbox';
import Archive from '@material-ui/icons/Archive';
import List from '@material-ui/icons/List';
import { Animated } from "react-animated-css";
import Pin from '@material-ui/icons/Add';
import Label from '@material-ui/icons/Label';
import { Steps } from 'intro.js-react';
import 'intro.js/introjs.css';
import '../tooltip.css';

const styles = theme => ({
    categories: {
        paddingTop: "2em",
        width: "100%",
        paddingLeft: "2%",
        paddingRight: "5%",
        [theme.breakpoints.down('md')]: {
            paddingRight: "2%"
        },
    },
    tabContainer: {
        justifyContent: "center",
        width: 0
    },
    label: {
        fontWeight: "bold",
        fontSize: "1.2em",
        color: "#4A4A4A"
    },
    tabBar: {
        paddingLeft: 0
    },
    tabs: {
        left: "0"
    },
    noTransaction: {
        textAlign: "center",
        padding: "2em",
        marginTop: "1em",
        backgroundColor: "#FCFADF"
    },
    thumbsup: {
        margin: "auto",
        maxHeight: "50px",
        maxWidth: "200px"
    },
    centered: {
        padding: "2em",
        textAlign: "center",
        backgroundColor: "#d8d8d8"
    },
    icon: {
        verticalAlign: "middle",
        color: "#4A4A4A"
    },
    tooltip: {
        color:'red'
    }
});

function TabContainer(props) {
    return (
        <Typography component="div" style={{ padding: 0 }}>
            {props.children}
        </Typography>
    );
}

TabContainer.propTypes = {
    children: PropTypes.node.isRequired,
};

class Categories extends Component {
    constructor(props) {
        super(props)
        this.state = {
            tab: 0,
            stepsEnabled: !this.props.intro_seen,
            initialStep: 0,
            steps: [
                {
                    element: '.intro-step-attention',
                    intro: "Welcome to Nimbus! Here are all the purchases that need your attention",
                    tooltipClass: 'tooltip'
                },
                {
                    element: '.intro-step-todo',
                    intro: 'Hit + to add a purchase to your to-do list and remember to take care of it later',
                    tooltipClass: 'tooltip'
                },
                {
                    element: '.intro-step-label',
                    intro: "We automatically label your purchases as subscriptions, things you might want to return or split. If we missed anything, you can also label it yourself",
                    tooltipClass: 'tooltip'
                },
                {
                    element: '.intro-step-archive',
                    intro: "Hit the check mark to archive a transaction. Out of sight, out of mind",
                    tooltipClass: 'tooltip'
                }
            ]
        }
    }

    onExit = () => {
        this.setState({ stepsEnabled: false });
        callServer('intro_seen', this.props.userId, this.props.accessToken, {}, () => {});
    };

    filterTransactions = (transactions, filter) => {
        return transactions.filter(transaction => {
            return transaction.label === filter
        });
    }

    getPriorityTransactions = (transactions) => {
        return transactions.filter(transaction => {
            return transaction.action_state === "untriaged" && transaction.label !== null;
        });
    }

    getOtherTransactions = (transactions) => {
        return transactions.filter(transaction => {
            return transaction.action_state === "untriaged" && transaction.label === null;
        });
    }

    getTodoTransactions = (transactions) => {
        return transactions.filter(transaction => {
            return transaction.action_state === "todo"
        });
    }

    getArchivedTransactions = (transactions) => {
        return transactions.filter(transaction => {
            return transaction.action_state === "archived";
        });
    }

    handleChange = (event, value) => {
        this.setState({ tab: value });
    };

    render() {
        const { transactions, classes } = this.props;

        let noTransactions;
        let noTodos;
        let noLabel;
        let noArchive;
        noTransactions = <Animated className={classes.noTransaction} animationIn="fadeIn" isVisible={true}><Animated animationIn="swing" isVisible={true}><img src="./thumbsup.png" className={classes.thumbsup} alt="thumbs up"></img></Animated> </Animated>
        noTodos = <div className={classes.centered}> To add a transaction to to-do's, just click the <Pin className={classes.icon} /> icon on the transaction </div>
        noLabel = <div className={classes.centered}> To label a transaction, just click the <Label className={classes.icon} /> icon on the transaction </div>
        noArchive = <div className={classes.centered}> To archive a transaction, just click the <Archive className={classes.icon} /> icon on the transaction </div>

        if (!transactions) {
            return null;
        }

        return (
            <div className={classes.categories}>
                <Steps
                    enabled={this.state.stepsEnabled}
                    steps={this.state.steps}
                    initialStep={this.state.initialStep}
                    onExit={this.onExit}
                />
                <Tabs
                    value={this.state.tab}
                    onChange={this.handleChange}
                    className={classes.tabs}
                    textColor="primary"
                    variant="scrollable"
                    indicatorColor="secondary"
                    scrollButtons="auto"
                >
                    <Tab label="Needs attention" icon={<AccountBalance />} className="intro-step-attention" />
                    <Tab label="Todo" icon={<List />} className="intro-step-todo" />
                    <Tab label="Subscriptions" icon={<Repeat />} className="intro-step-label" />
                    <Tab label="Splittables" icon={<CallSplit />} />
                    <Tab label="Returns" icon={<Box />} />
                    <Tab label="Archived" icon={<Archive />} className="intro-step-archive" />

                </Tabs>
                {this.state.tab === 0 && <TabContainer className={classes.tabContainer}>
                    <Animated animationIn="fadeIn" isVisible={true}>
                        <TransactionsList
                            title={"Needs attention"}
                            icon={<AccountBalance />}
                            transactions={this.getPriorityTransactions(transactions)}
                            archivable={true}
                            type={"untriaged"}
                            showLabels={true}
                            noTransactionState={noTransactions}
                            header={<Typography className={classes.label}> <New className={classes.icon} /> Needs attention </Typography>}
                            userId={this.props.userId}
                            accessToken={this.props.accessToken}
                        />

                        <TransactionsList
                            title={"Needs attention (old)"}
                            icon={<AccountBalance />}
                            archivable={true}
                            type={"untriaged"}
                            showLabels={true}
                            noTransactionState={noTransactions}
                            header={<Typography className={classes.label}> <Inbox className={classes.icon} /> Other recent purchases </Typography>}
                            transactions={this.getOtherTransactions(transactions)}
                            userId={this.props.userId}
                            accessToken={this.props.accessToken}
                        />
                    </Animated>
                </TabContainer>}
                {this.state.tab === 1 && <TabContainer>
                    <Animated animationIn="fadeIn" isVisible={true}>
                        <TransactionsList
                            title={"Todo"}
                            type={"todo"}
                            noTransactionState={noTodos}
                            showLabels={true}
                            transactions={this.getTodoTransactions(transactions)}
                            userId={this.props.userId}
                            accessToken={this.props.accessToken}
                        />
                    </Animated>
                </TabContainer>}
                {this.state.tab === 2 && <TabContainer>
                    <Animated animationIn="fadeIn" isVisible={true}>
                        <TransactionsList
                            title={"Subscriptions"}
                            noTransactionState={noLabel}
                            transactions={this.filterTransactions(transactions, "subscription")}
                            userId={this.props.userId}
                            accessToken={this.props.accessToken}
                        />
                    </Animated>
                </TabContainer>}
                {this.state.tab === 3 && <TabContainer>
                    <Animated animationIn="fadeIn" isVisible={true}>
                        <TransactionsList
                            title={"Splittables"}
                            transactions={this.filterTransactions(transactions, "splittable")}
                            userId={this.props.userId}
                            noTransactionState={noLabel}
                            accessToken={this.props.accessToken}
                        />
                    </Animated>
                </TabContainer>}
                {this.state.tab === 4 && <TabContainer>
                    <Animated animationIn="fadeIn" isVisible={true}>
                        <TransactionsList
                            title={"Returns"}
                            transactions={this.filterTransactions(transactions, "return")}
                            userId={this.props.userId}
                            noTransactionState={noLabel}
                            accessToken={this.props.accessToken}
                        />
                    </Animated>
                </TabContainer>}
                {this.state.tab === 5 && <TabContainer>
                    <Animated animationIn="fadeIn" isVisible={true}>
                        <TransactionsList
                            title={"Archived"}
                            showLabels={true}
                            type={"archived"}
                            noTransactionState={noArchive}
                            transactions={this.getArchivedTransactions(transactions)}
                            userId={this.props.userId}
                            accessToken={this.props.accessToken}
                        />
                    </Animated>
                </TabContainer>}
            </div >
        )
    }
}

export default withStyles(styles)(Categories);