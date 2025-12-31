import { Types } from "mongoose";
import { IBaseFIelds } from "./base.interface";
import { BillingPaymentStatus, commonStatus } from "../types/enum.types";
import { IItem } from "./item.interface";

export interface IBillingRecords extends IBaseFIelds {
  vendorId: Types.ObjectId;
  billNumber: string;
  purchaseOrderNumber: Types.ObjectId;
  billDate: Date;
  dueDate: Date;
  branchId: Types.ObjectId;
  payment: BillingPaymentStatus;
  items: IItem[];
  note:string;
  terms:string;
  discountType:string;
  discountValue:number;
  vatValue:number;
  status:keyof typeof commonStatus;
  documents: string[];
  subTotal: number;
  taxTotal: number;
  total: number;
}
