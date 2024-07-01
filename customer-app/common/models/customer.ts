/* eslint-disable prettier/prettier */
import mongoose from 'mongoose';
import { CustomerInterface } from '../types/customerTypes';

//defining a customer schema
export const customerSchema = new mongoose.Schema({
    customerID: {
        type: String,
        validate: {
            validator: function (v: string) {
                return /[A-Z]{1}\d{4}$/.test(v);
            },
            message: (props: { value: any; }) => `${props.value} is invalid. Customer ID should be in the format A1209`
        },
        required: [true, 'Customer ID is a required field'],
        unique: true
    },
    name: {
        type: String,
        required: [true, 'Customer name is a required field']
    },
    email: {
        type: String,
        validate: {
            validator: function (v: string) {
                return /^[^\.\s][\w\-]+(\.[\w\-]+)*@([\w-]+\.)+[\w-]{2,}$/.test(v);
            },
            message: (props: { value: any; }) => `${props.value} is invalid. Enter a valid email address`
        },
        required: [true, 'Customer email is a required field'],
        unique: true
    },
    tel: {
        type: String,
        validate: {
            validator: function (v: string) {
                return /\d{10}/.test(v);
            },
            message: (props: { value: any; }) => `${props.value} is not a valid phone number!`
        },
        required: [true, 'Customer telephone number is a required field']
    },
    address: {
        type: String,
        required: [true, 'Customer address is a required field']
    },
    country: {
        type: String,
        required: true
    },
    verifiedStatus: {
        type: Boolean,
        required: true
    },
});

//creating a customer model
const Customer = mongoose.model<CustomerInterface>('Customer', customerSchema);

export default Customer;