import { Types } from "mongoose";
import { IBaseFIelds } from "./base.interface";
import {  commonStatus } from "../types/enum.types";
import { IItem } from "./item.interface";

export interface IBillingRecords extends IBaseFIelds {
  vendorId: Types.ObjectId;
  billNumber: string;
  purchaseOrderNumber?: Types.ObjectId | null ;
  purchaseOrder?:string
  billDate: Date;
  dueDate: Date;
  branchId: Types.ObjectId;
  paymentTermsId: Types.ObjectId;
  items: IItem[];
  note:string;
  terms:string;
  discountType:string;
  discountValue:number;
  vatValue:number;
  status:commonStatus;
  documents: string[];
  subTotal: number;
  taxTotal: number;
  total: number;
  balanceDue?:number;
}
