// tslint:disable:jsx-no-multiline-js
// tslint:disable:jsx-no-lambda
import keys from 'lodash/keys';
import isEmpty from 'lodash/isEmpty';
import find from 'lodash/find';
import merge from 'lodash/merge';
import DialogActions from '@material-ui/core/DialogActions';
import DialogTitle from '@material-ui/core/DialogTitle';
import { connect } from 'react-redux';
import {
    getData,
    getDefaultData,
    getSchema, JsonFormsState,
    JsonSchema,
    JsonSchema7,
    Paths,
    Resolve,
    update
} from '@jsonforms/core';
import { findContainerProperties, findPropertyLabel, Property } from '../services/property.util';
import Button from '@material-ui/core/Button';
import DialogContent from '@material-ui/core/DialogContent';
import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import ListSubheader from '@material-ui/core/ListSubheader';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { SchemaLabelProvider } from '../helpers/LabelProvider';
import { AnyAction, Dispatch } from 'redux';

export interface AddItemDialogProps {
    rootData: any;
    containerProperties: Property[];
    rootSchema: any;
    path: string;
    schema: JsonSchema;
    closeDialog: any;
    dialogProps: any;
    setSelection: any;
    add?: any;
    labelProvider?: SchemaLabelProvider;
    defaultData: { schemaPath: string, data: any}[];
    imageProvider(schema: JsonSchema): string;
}

const createData = (defaultData: any, prop: Property) => {
    const foundData = find(defaultData, d => {
        return d.schemaPath === prop.schemaPath;
    });

    // default behavior is to read default property from schemas
    const predefined = keys(prop.schema.properties).reduce(
        (acc: any, key: string) => {
            if (prop.schema.properties[key].default) {
                acc[key] = prop.schema.properties[key].default;
            }

            // FIXME generate id if identifying property
            // is set in editor to allow id refs
            return acc;
        },
        {}
    );

    return merge(foundData ? foundData.data : {}, predefined);
};

const createPropLabel =
    (prop: Property, labelProvider: (schema: JsonSchema, path: string) => string) => {
        let label = prop.label;
        if (labelProvider) {
            label = labelProvider(prop.schema, prop.schemaPath);
        }
        return `${prop.property} [${label}]`;
    };

class AddItemDialog extends React.Component<AddItemDialogProps, {}> {

    onClick = (prop: Property) => {
        console.log(prop);
        const { add, closeDialog, defaultData, path, rootData, setSelection } = this.props;
        const newData = createData(defaultData, prop);

        const arrayPath = Paths.compose(path, prop.property);
        const array = Resolve.data(rootData, arrayPath) as any[];
        const selectionIndex = isEmpty(array) ? 0 : array.length;
        const selectionPath = Paths.compose(arrayPath, selectionIndex.toString());

        add(path, prop, newData);
        setSelection(prop.schema, newData, selectionPath)();
        closeDialog();
    };

    addMissingControl = (scope: string, label: string) => {
        console.log(scope);
        const { add, closeDialog, path, rootData, setSelection } = this.props;
        const prop: Property = {
            label: 'control',
            property: 'elements',
            schemaPath: 'properties.elements.items.anyOf.0',
            schema: {
                'type': 'object',
                '$id': '#control',
                'properties': {
                    'type': {
                    'type': 'string',
                    'const': 'Control',
                    'default': 'Control'
                    },
                    'label': {
                    'type': 'string'
                    },
                    'scope': {
                    '$ref': '#/definitions/scope'
                    },
                    'options': {
                    '$ref': '#/definitions/options'
                    },
                    'rule': {
                    '$ref': '#/definitions/rule'
                    }
                } 
            }
        }
        const newData = {
            type: "Control",
            scope,
            label
        }
        console.log(newData);

        const arrayPath = Paths.compose(path, prop.property);
        const array = Resolve.data(rootData, arrayPath) as any[];
        const selectionIndex = isEmpty(array) ? 0 : array.length;
        const selectionPath = Paths.compose(arrayPath, selectionIndex.toString());

        add(path, prop, newData);
        setSelection(prop.schema, newData, selectionPath)();
        closeDialog();
    };

    render() {
        const {
            closeDialog,
            dialogProps,
            /**
             * Self contained schemas of the corresponding schema
             */
            containerProperties,
            labelProvider,
        } = this.props;

        return (
            <Dialog id='dialog' {...dialogProps}>
                <DialogTitle id='dialog-title'>
                    Select item to create
                </DialogTitle>
                <DialogContent>
                    <List
                        subheader={<ListSubheader component="div">Missing controls</ListSubheader>}>
                        <ListItem
                            button
                            key='creditCardName'
                            onClick={() => this.addMissingControl('#/properties/creditCard/properties/creditCardName', "Credit Card Name")}
                        >
                            <ListItemText primary='creditCardName' />
                        </ListItem>
                        <ListItem
                            button
                            key='creditCardNumber'
                            onClick={() => this.addMissingControl('#/properties/creditCard/properties/creditCardNumber', "Credit Card Number")}
                        >
                            <ListItemText primary='creditCardNumber' />
                        </ListItem>
                        <ListItem
                            button
                            key='creditCardCCV'
                            onClick={() => this.addMissingControl('#/properties/creditCard/properties/creditCardCCV', "Credit Card CCV")}
                        >
                            <ListItemText primary='creditCardCCV' />
                        </ListItem>
                        <ListItem
                            button
                            key='creditCardExpire'
                            onClick={() => this.addMissingControl('#/properties/creditCard/properties/creditCardExpire', "Credit Card Expiration Date")}
                        >
                            <ListItemText primary='creditCardExpire' />
                        </ListItem>
                    </List>
                    <List
                        subheader={<ListSubheader component="div">New item</ListSubheader>}>
                        {
                            containerProperties
                                .map((prop, index) => {
                                    const label = createPropLabel(prop, labelProvider);
                                    return (
                                        <ListItem
                                            button
                                            key={`${findPropertyLabel(prop)}-button-${index}`}
                                            onClick={() => this.onClick(prop)}
                                        >
                                            <ListItemText primary={label} />
                                        </ListItem>
                                    );
                                })
                        }
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDialog} variant='outlined' color='primary'>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

// TODO
const mapStateToProps = (state: JsonFormsState, ownProps: any) => {
    const containerProperties = findContainerProperties(ownProps.schema, getSchema(state) as JsonSchema7, false);
    const missingControls = [
        {
            path: "#/properties/birthDay",
            label: "Birthday"
        },
        {
            path: "#/properties/age",
            label: "Age"
        },
    ]

    return {
        rootData: getData(state),
        defaultData: getDefaultData(state),
        containerProperties,
        missingControls,
        rootSchema: getSchema(state),
        path: ownProps.path,
        schema: ownProps.schema,
        closeDialog: ownProps.closeDialog,
        dialogProps: ownProps.dialogProps,
        setSelection: ownProps.setSelection,
        labelProvider: ownProps.labelProvider
    };
};

const mapDispatchToProps = (dispatch: Dispatch<AnyAction>) => ({
    add(path: string, prop: Property, newData: any) {
        dispatch(
            update(
                Paths.compose(path, prop.property),
                array => {
                    if (isEmpty(array)) {
                        return [newData];
                    }
                    array.push(newData);

                    return array;
                }
            )
        );
    }
});

export default connect(mapStateToProps, mapDispatchToProps)(AddItemDialog);
