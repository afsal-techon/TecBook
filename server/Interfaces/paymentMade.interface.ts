import { Types } from "mongoose";
import { IBaseFIelds } from "./base.interface";
import { commonStatus } from "../types/enum.types";

export interface IPaymentMade extends IBaseFIelds{
    vendorId: Types.ObjectId,
    branchId?:Types.ObjectId | null
    amount: number,
    date: Date,
    bankCharge:number,
    paymentId:string,
    paymentMode:string,
    accountId:Types.ObjectId,
    note:string,
    reference?:string,
    documents?:string[],
    status: commonStatus;
    

}