import { Types } from "mongoose";

export interface IItem {
  itemId?: Types.ObjectId | null;
  taxId?: Types.ObjectId | null;
  prevItemId?: Types.ObjectId | null;
  itemName: string | undefined;
  qty?: number;
  rate?: number;
  amount?: number;
  unit?: string;
  discount?: number;
  customerId?: Types.ObjectId | null;
  accountId?: Types.ObjectId | null;
  projectId?: Types.ObjectId  | null;
  billable?: boolean;
  note?:string
}
