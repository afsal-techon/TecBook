import { model, Model, Schema } from "mongoose";
import { BaseSchemaFields } from "./common/BaseSchemaFields";
import { ItemsSchemaFields } from "./common/ItemsSchemaFields";
import {
  CreditNoteStatus,
  PurchaseOrderDiscountType,
} from "../types/enum.types";
import { ICreditNote } from "../Interfaces/credit-note.interface";

const creditNoteSchema = new Schema<ICreditNote>(
  {
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    salesPersonId: {
      type: Schema.Types.ObjectId,
      ref: "SalesPeople",
      required: true,
    },
    creditNoteNumber: {
      type: String,
      required: false,
    },
    subject: {
      type: String,
      required: false,
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
      enum: CreditNoteStatus,
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
      required: false,
      default: 0,
    },
    receivedAmount: {
      type: Number,
      required: false,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);
creditNoteSchema.add(BaseSchemaFields);
creditNoteSchema.add(ItemsSchemaFields);

export const CreditNoteModel = model<ICreditNote>(
  "CreditNote",
  creditNoteSchema
);

export type CreditNoteModelDocument = typeof CreditNoteModel;

export const CreditNoteModelConstants = {
  branchId: "branchId",
  customerId: "customerId",
  date: "date",
  salesPersonId: "salessPersonId",
  creditNoteNumber: "creditNoteNumber",
  subject: "subject",
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
