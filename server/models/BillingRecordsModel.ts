import { model, Schema } from "mongoose";
import { BillingPaymentStatus } from "../types/enum.types";
import { BaseSchemaFields } from "./common/BaseSchemaFields";
import { ItemsSchemaFields } from "./common/ItemsSchemaFields";
import { IBillingRecords } from "../Interfaces/billing-records.interface";

const BillngRecordSchema = new Schema<IBillingRecords>(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    billNumber: {
      type: String,
      unique: true,
    },
    purchaseOrderNumber: {
      type: Schema.Types.ObjectId,
      ref: "PurchaseOrder",
      required: true,
    },
    billDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    payment: {
      type: String,
      enum: BillingPaymentStatus,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

BillngRecordSchema.add(BaseSchemaFields);
BillngRecordSchema.add(ItemsSchemaFields);

export const BillingSchemaModel = model<IBillingRecords>(
  "BillingRecords",
  BillngRecordSchema
);

export type BillingSchemaModelDocument = typeof BillingSchemaModel;

export const BillingSchemaModelConstants = {
  vendorId: "vendorId",
  billNumber: "billNumber",
  purchaseOrderNumber: "purchaseOrderNumber",
  billDate: "billDate",
  dueDate: "dueDate",
  branchId: "branchId",
  payment: "payment",
  items: "items",
  createdBy: "createdBy",
  isDeleted: "isDeleted",
} as const;

export type BillingRecordsField = keyof typeof BillingSchemaModelConstants;
