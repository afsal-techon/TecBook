import { Schema, Types } from "mongoose";
import { IBaseFIelds } from "./base.interface";
import { IItem } from "./item.interface";
import { TaxPreferences } from "../types/enum.types";

export interface IExpenses extends IBaseFIelds {
  date: Date;
  expenseNumber: string;
  customerId: Types.ObjectId;
  taxPreference?: TaxPreferences;
  paidAccount: Types.ObjectId;
  vendorId: Types.ObjectId;
  branchId: Types.ObjectId;
  items: IItem[];
  note: string;
  terms: string;
  discountType: string;
  discountValue: number;
  vatValue: number;
  status: string;
  documents: string[];
  subTotal: number;
  taxTotal: number;
  total: number;
  isBillable?:boolean;
  projectId?:Types.ObjectId
}
