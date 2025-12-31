import { Types } from "mongoose";

export interface IItem {
  itemId: Types.ObjectId;
  taxId: Types.ObjectId;
  prevItemId?: Types.ObjectId | null;
  itemName: string;
  qty: number;
  rate: number;
  amount: number;
  unit: string;
  discount: number;
  customerId?: Types.ObjectId | null;
  accountId?: Types.ObjectId | null;
}
