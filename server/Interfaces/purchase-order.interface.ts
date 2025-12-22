import { Types } from "mongoose";
import { IItem } from "./item.interface";
import { IBaseFIelds } from "./base.interface";

export interface IPurchaseOrder extends IBaseFIelds {
  purchaseOrderNumber: number;
  vendorId: Types.ObjectId | null;
  quoteNumber: string;
  quoteDate: Date;
  expiryDate: Date;
  salesmanId: Types.ObjectId;
  projectId?: Types.ObjectId;

  items: IItem[];
  createdBy: Types.ObjectId;
}
