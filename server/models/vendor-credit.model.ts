import { model, Schema } from "mongoose";
import { IVendorCredit } from "../Interfaces/vendor-credit.interface";
import { ItemsSchemaFields } from "./common/ItemsSchemaFields";
import { BaseSchemaFields } from "./common/BaseSchemaFields";
import { commonStatus, PurchaseOrderDiscountType } from "../types/enum.types";

export const vendorCreditSchema = new Schema<IVendorCredit>(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
    },
    vendorCreditNoteNumber: {
      type: String,
      required: true,
    },
    referenceNumber: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
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
    balanceAmount: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

vendorCreditSchema.add(ItemsSchemaFields);
vendorCreditSchema.add(BaseSchemaFields);
export const vendorCreditModel = model<IVendorCredit>(
  "vendorCredit",
  vendorCreditSchema
);
export type vendorCreditModelDocument = typeof vendorCreditModel;

export const vendorCreditModelConstants = {
  vendorId: "vendorId",
  vendorCreditNoteNumber: "vendorCreditNoteNumber",
  referenceNumber: "referenceNumber",
  date: "date",
  subject: "subject",
  branchId: "branchId",
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
  balanceAmount: "balanceAmount",
};

