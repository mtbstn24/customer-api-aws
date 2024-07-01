/* eslint-disable prettier/prettier */
import mongoose, { ObjectId } from 'mongoose';
import { CustomerInterface } from '../types/customerTypes';
import Customer from '../models/customer';

const MONGODB_URI: string | undefined = process.env.MONGODB_URI;
const dbConnectionCurrentState = mongoose.connection.readyState;
const dbConnectionStates = {
    disconnected: 0,
    connected: 1,
    connecting: 2,
    disconnecting: 3
}

export const connectDB = async (): Promise<void> => {
    if (dbConnectionCurrentState === dbConnectionStates.connected) {
        console.log('Already connected to Mongo DB');
        return;

    } else {
        try {
            if (MONGODB_URI) {
                await mongoose.connect(MONGODB_URI, {
                    retryWrites: false,
                    serverSelectionTimeoutMS: 5000,
                });
                console.log('Successfully connected to Mongo DB');
            } else {
                console.log('MONGODB_URI is undefined');
            }
        } catch (error) {
            console.error('Failed to connect to Mongo DB : ', error);
        }
    }
};

export const getAllCustomersFromDB = async () => {
    await connectDB();
    const customers: CustomerInterface[] = await Customer.find({}); //checks for documents in collection named 'customers'
    return customers;
};

export const getCustomerByIDFromDB = async (customerId: string) => {
    await connectDB();
    const customer: CustomerInterface | null = await Customer.findOne({ customerID: customerId });
    return customer;
};

export const getCustomerByEmailFromDB = async (customerEmail: string) => {
    await connectDB();
    const customer: CustomerInterface | null = await Customer.findOne({ email: customerEmail });
    return customer;
};

export const insertCustomerToDB = async (customerDetails: CustomerInterface) => {
    await connectDB();
    const customer: mongoose.HydratedDocument<CustomerInterface> = new Customer(customerDetails);
    const result = await customer.save();
    return result;
};

export const updateCustomerToDB = async (
    docId: ObjectId,
    customerId: string,
    customerDetails: object,
): Promise<CustomerInterface | null> => {
    await connectDB();
    // findByIdAndUpdate returns the updated document
    const result: CustomerInterface | null = await Customer.findByIdAndUpdate(
        docId,
        customerDetails,
        { returnDocument: 'after' }
    );
    //updateOne does not return the updated document

    return result;
};

export const deleteCustomerFromDB = async (customerId: string): Promise<mongoose.mongo.DeleteResult> => {
    await connectDB();
    const result = await Customer.deleteOne({ customerID: customerId });
    return result;
};
