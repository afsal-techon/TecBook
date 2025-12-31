import { model, Schema } from "mongoose";
import { BaseSchemaFields } from "./common/BaseSchemaFields";
import { ItemsSchemaFields } from "./common/ItemsSchemaFields";
import { commonStatus, PurchaseOrderDiscountType, TaxPreferences } from "../types/enum.types";
import { IExpenses } from "../Interfaces/expenses.interface";

const ExpenseModelSchema = new Schema<IExpenses>(
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
    note: {
      type: String,
      default: null,
    },
    terms: {
      type: String,
      default: null,
    },
    discountType: {
      type: String,
      enum: PurchaseOrderDiscountType,
      default: PurchaseOrderDiscountType.PERCENTAGE,
    },
    discountValue: {
      type: Number,
      default: 0,
    },
    vatValue: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: commonStatus,
    },
    documents: {
      type: [String],
      default: [],
    },
    subTotal: {
      type: Number,
      required: true,
      default: 0,
    },

    taxTotal: {
      type: Number,
      required: true,
      default: 0,
    },

    total: {
      type: Number,
      required: true,
      default: 0,
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
  note: "note",
  terms: "terms",
  discountType: "discountType",
  discountValue: "discountValue",
  vatValue: "vatValue",
  status: "status",
  documents: "documents",
  subTotal: "subTotal",
  taxTotal: "taxTotal",
  total: "total",
};
// export type ExpenseModelField = keyof typeof ExpenseModelConstants;
