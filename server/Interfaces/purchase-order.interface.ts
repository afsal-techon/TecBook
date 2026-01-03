import { Types } from "mongoose";
import { IItem } from "./item.interface";
import { IBaseFIelds } from "./base.interface";
import { PurchaseOrderStatus } from "../types/enum.types";

export interface IPurchaseOrder extends IBaseFIelds {
  purchaseOrderId: string;
  vendorId: Types.ObjectId | null;
  quote: string;
  purchaseOrderDate: Date;
  expDate: Date;
  salesPersonId: Types.ObjectId;
  projectId?: Types.ObjectId;
  branchId: Types.ObjectId;
  items: IItem[];
  createdBy: Types.ObjectId;
  note:string;
  terms:string;
  discountType:string;
  discountValue:number;
  vatValue:number;
  status: PurchaseOrderStatus;
  documents: string[];
  subTotal: number;
  taxTotal: number;
  total: number;
  paymentTermsId?: Types.ObjectId;
  billedStatus:PurchaseOrderStatus;
}
