import mongoose from "mongoose";

//defining a customer interface
export interface CustomerInterface extends mongoose.Document {
    _id: mongoose.ObjectId;
    customerID: string;
    name: string;
    email: string;
    tel: string;
    address: string;
    country: string;
    verifiedStatus: boolean;
}
