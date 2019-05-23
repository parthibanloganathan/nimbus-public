import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Typography from '@material-ui/core/Typography';
import withStyles from '@material-ui/core/styles/withStyles';
import Check from '@material-ui/icons/Check';
import Chip from '@material-ui/core/Chip';
import { updateTransactions } from '../actions/transactionActions';
import IconButton from '@material-ui/core/IconButton';
import Unarchive from '@material-ui/icons/Unarchive';
import CheckAll from '@material-ui/icons/PlaylistAddCheck';
import Label from '@material-ui/icons/Label';
import Pin from '@material-ui/icons/Add';
import Tooltip from '@material-ui/core/Tooltip';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { Swipeable } from 'react-swipeable'

const defaultListSize = 5;
const maxListSize = 100;

const styles = theme => ({
    root: {
        paddingBottom: "1em",
        paddingTop: "2em",
    },
    headers: {
        fontSize: "1.1em",
        fontWeight: "bold",
        paddingTop: "1.5em",
        paddingBottom: "1em",
        color: "#4A4A4A",
        lineHeight: "100%",
        minHeight: "100vh"
    },
    listItem: {
        borderBottom: "1px solid #E8E8E8",
        padding: "1em",
        "&:last-child": {
            borderBottom: "0px",
        },
    },
    list: {
        marginRight: 20
    },
    amount: {
        marginRight: "2em"
    },
    iconImage: {
        height: "4em",
        width: "4em"
    },
    date: {
        color: "grey",
        fontSize: "0.7em",
    },
    listButtons: {
        width: '100%',
        height: 50
    },
    titleButtons: {
        float: 'left',
        margin: 10
    },
    selectAll: {
        float: 'right'
    },
    icon: {
        color: "grey"
    },
    transactionContainer: {
        border: "1px solid #d8d8d8d8",

    },
    returnLink: {
        fontSize: "0.8em"
    },
    money: {
        paddingTop: "0.2em",
        fontSize: "0.9em",
        color: "green"
    }, 
    chipMobile:{
        marginTop:"0.5em",
        [theme.breakpoints.up('md')]: {
          display:"none"
        },
    },
    chipDesktop:{
        [theme.breakpoints.down('sm')]: {
          display:"none"
        },
    }, 
    

});

class TransactionsList extends Component {
    constructor(props) {
        super(props)

        this.state = {
            labelModalOpen: false,
            num: maxListSize,
            anchorEl: null,
            createLabel: ""
        }
    }

    expandList = () => {
        this.setState({ num: maxListSize });
    }

    collapseList = () => {
        this.setState({ num: defaultListSize });
    }

    handleOpenCreateLabel = (event, transactionId) => {
        this.setState({ anchorEl: event.currentTarget, selectedTransaction: transactionId });
    };

    handleClickCreateLabelOption = (label) => {
        this.setState({ createLabel: label, anchorEl: null }, () => {
            this.createLabel(this.state.selectedTransaction, this.state.createLabel);
        });
    };

    handleCloseCreateLabel = () => {
        this.setState({ anchorEl: null });
    };

    handleActionStateChange = (transactionId, newActionState) => {
        let transactionToChange = this.props.transactions.find(transaction => transaction.transaction_id === transactionId);
        transactionToChange.action_state = newActionState;
        this.props.dispatch(updateTransactions(this.props.userId, this.props.accessToken, [transactionToChange]));
    }

    handleDeleteLabel = (transactionId) => {
        let transactionToChange = this.props.transactions.find(transaction => transaction.transaction_id === transactionId);
        transactionToChange.label = null;
        this.props.dispatch(updateTransactions(this.props.userId, this.props.accessToken, [transactionToChange]));
    }

    createLabel = (transactionId, label) => {
        let transactionToChange = this.props.transactions.find(transaction => transaction.transaction_id === transactionId);
        transactionToChange.label = label;
        this.props.dispatch(updateTransactions(this.props.userId, this.props.accessToken, [transactionToChange]));
    }

    archiveAll = () => {
        var currentActionState = this.props.type;
        let transactionsToChange = this.props.transactions.filter(transaction => transaction.action_state === currentActionState);
        transactionsToChange.forEach(transaction => transaction.action_state = "archived");
        this.props.dispatch(updateTransactions(this.props.userId, this.props.accessToken, transactionsToChange));
    }

    calculateTotal = (transactions) => {
        // https://stackoverflow.com/questions/149055/how-can-i-format-numbers-as-dollars-currency-string-in-javascript
        return transactions.reduce((total, transaction) => (total += Math.abs(parseFloat(transaction.amount))),
        0).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }

    render() {
        const { archivable, transactions, classes, showLabels, noTransactionState } = this.props;

        // let moreButton;
        // if (this.state.num === defaultListSize) {
        //     moreButton = <Button onClick={this.expandList}>More</Button>;
        // } else {
        //     moreButton = <Button onClick={this.collapseList}>Less</Button>;
        // }

        let list;

        const swipeableStyle =  {width:"100%", display:"flex", padding: "1em"}

        if (transactions.length === 0) {
            list = <div className={classes.root}> {this.props.header}{noTransactionState}</div>
        } else {
            list =
                <div className={classes.root}>
                    {archivable &&
                        <div className={classes.listButtons}>
                            <div className={classes.titleButtons}>
                                {this.props.header}
                            </div>
                            <div className={classes.selectAll}>
                                <Tooltip title="Archive All" aria-label="Archive All">
                                    <IconButton
                                        onClick={this.archiveAll}
                                        color="inherit">
                                        <CheckAll className={classes.icon} />
                                    </IconButton>
                                </Tooltip>
                            </div>
                        </div>
                    }
                    <Typography><b>Total value</b>: ${this.calculateTotal(transactions)}</Typography>
                    <div className={classes.transactionContainer}>
                        <List>
                            {transactions.slice(0, this.state.num).map(transaction =>
                                <ListItem
                                    key={transaction.transaction_id} 
                                    className={classes.listItem}>
                                    <Swipeable style={swipeableStyle} onSwipedRight = {() => this.handleActionStateChange(transaction.transaction_id, "archived")} onSwipedLeft = {() => this.handleActionStateChange(transaction.transaction_id, "todo")} > 
                                    <img src={transaction.image} className={classes.iconImage} alt="transaction icon"></img>
                                    <ListItemText>
                                        <Typography> <b>{transaction.name.substr(0,60)}</b></Typography>
                                        <Typography className={classes.date}> {transaction.date}  </Typography>
                                        <Typography className={classes.money}> ${transaction.amount} </Typography>
                                        {transaction.return_link && <div> <a className={classes.returnLink} target="_blank" href={transaction.return_link}> Return </a> </div>}
                                        {transaction.label && <Chip className={classes.chipMobile} onDelete={() => this.handleDeleteLabel(transaction.transaction_id)} label={transaction.label.toUpperCase()} />}

                                    </ListItemText>
                                    {transaction.label ?
                                        <Chip className={classes.chipDesktop} onDelete={() => this.handleDeleteLabel(transaction.transaction_id)} label={transaction.label.toUpperCase()} />
                                        :
                                        <Tooltip title="Label Transaction" aria-label="Label Transaction">
                                            <IconButton
                                                onClick={(event) => this.handleOpenCreateLabel(event, transaction.transaction_id)}
                                                color="inherit"
                                            >
                                                <Label className={classes.icon} />
                                            </IconButton>
                                        </Tooltip>
                                    }
                                    {showLabels &&
                                        <Fragment>
                                            {(transaction.action_state === "untriaged") &&
                                                <Tooltip title="Todo" aria-label="Todo">
                                                    <IconButton
                                                        onClick={() => this.handleActionStateChange(transaction.transaction_id, "todo")}
                                                        color="inherit">
                                                        <Pin className={classes.icon} />
                                                    </IconButton>
                                                </Tooltip>
                                            }
                                            {transaction.action_state === "archived" &&
                                                <Tooltip title="Unarchive" aria-label="Unarchive">
                                                    <IconButton
                                                        onClick={() => this.handleActionStateChange(transaction.transaction_id, "untriaged")}
                                                        color="inherit">
                                                        <Unarchive className={classes.icon} />
                                                    </IconButton>
                                                </Tooltip>
                                            }
                                            {(transaction.action_state === "untriaged" || transaction.action_state === "todo") &&
                                                <Tooltip title="Archive" aria-label="Archive">
                                                    <IconButton
                                                        onClick={() => this.handleActionStateChange(transaction.transaction_id, "archived")}
                                                        color="inherit">
                                                        <Check className={classes.icon} />
                                                    </IconButton>
                                                </Tooltip>
                                            }
                                        </Fragment>
                                    }
                                    </Swipeable>
                                </ListItem>
                            )}
                        </List>
                    </div>
                </div>
        }

        return (
            <Fragment>
                {list}
                <Menu
                    id="create-label-menu"
                    anchorEl={this.state.anchorEl}
                    open={Boolean(this.state.anchorEl)}
                    onClose={this.handleCloseCreateLabel}
                >
                    <MenuItem onClick={() => this.handleClickCreateLabelOption("subscription")}>Subscription</MenuItem>
                    <MenuItem onClick={() => this.handleClickCreateLabelOption("return")}>Return</MenuItem>
                    <MenuItem onClick={() => this.handleClickCreateLabelOption("splittable")}>Splittable</MenuItem>
                </Menu>
            </Fragment >
        );
    }
}

export default connect()(withStyles(styles)(TransactionsList));
