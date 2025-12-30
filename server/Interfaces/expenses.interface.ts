import { Schema } from "mongoose";
import { IBaseFIelds } from "./base.interface";
import { IItem } from "./item.interface";
import { TaxPreferences } from "../types/enum.types";

export interface IExpenses extends IBaseFIelds {
  date: Date;
  expenseNumber: string;
  customerId: Schema.Types.ObjectId;
  taxPreference: TaxPreferences;
  paidAccount: Schema.Types.ObjectId;
  vendorId: Schema.Types.ObjectId;
  branchId: Schema.Types.ObjectId;
  items: IItem[];
}
