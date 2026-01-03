import { model, Schema } from "mongoose";
import {
  BillingRecordsStatus,
  PurchaseOrderDiscountType,
} from "../types/enum.types";
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
      required: false,
    },
    purchaseOrder:{
      type:String,
      required:false
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
    paymentTermsId: {
      type: Schema.Types.ObjectId,
      ref: 'PaymentTerm',
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
      enum: BillingRecordsStatus,
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
    balanceDue:{
      type:Number,
      default:0
    }
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
  purchaseOrder:"purchaseOrder",
  billDate: "billDate",
  dueDate: "dueDate",
  branchId: "branchId",
  paymentTermsId: "paymentTermsId",
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
} as const;

export type BillingRecordsField = keyof typeof BillingSchemaModelConstants;
