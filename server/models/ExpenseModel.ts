import { model, Schema } from "mongoose";
import { BaseSchemaFields } from "./common/BaseSchemaFields";
import { ItemsSchemaFields } from "./common/ItemsSchemaFields";
import { TaxPreferences } from "../types/enum.types";

const ExpenseModelSchema = new Schema(
  {
    date: {
      type: Date,
      required: true,
      default: Date.now(),
    },
    expenseNumber: {
      type: String,
      required: true,
      unique: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    taxPreference: {
      type: String,
      enum: TaxPreferences,
      required: true,
    },
    paidAccount: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
ExpenseModelSchema.add(BaseSchemaFields);
ExpenseModelSchema.add(ItemsSchemaFields);

export const ExpenseModel = model("ExpenseModel", ExpenseModelSchema);
export type ExpenseModelDocument = typeof ExpenseModel;

export const ExpenseModelConstants = {
  date: "date",
  expenseNumber: "expenseNumber",
  customerId: "customerId",
  branchId: "branchId",
  taxPreference: "taxPreference",
  paidAccount: "paidAccount",
  vendorId: "vendorId",
  items: "items",
  createdBy: "createdBy",
  isDeleted: "isDeleted",
};
// export type ExpenseModelField = keyof typeof ExpenseModelConstants;
