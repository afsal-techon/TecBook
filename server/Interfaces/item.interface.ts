import { Types } from "mongoose";

export interface IItem {
  taxId?: Types.ObjectId | null;
  itemId?: Types.ObjectId | null;
  itemName: string;
  qty: number;
  tax: number;
  rate: number;
  amount: number;
  unit: string;
  discount: number;
}
