import { Types } from "mongoose";
import { IBaseFIelds } from "./base.interface";

export interface IPaymentMade extends IBaseFIelds{
    vendorId: Types.ObjectId,
    branchId?:Types.ObjectId | null
    amount: number,
    date: Date,
    bankCharge:number,
    paymentId:string,
    paymentModeId:Types.ObjectId,
    accountId:Types.ObjectId
    note:string
}