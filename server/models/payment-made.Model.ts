import { Document, Model, model, Schema } from "mongoose";
import { IPaymentMade } from "../Interfaces/paymentMade.interface";
import { BaseSchemaFields } from "./common/BaseSchemaFields";
import { commonStatus } from "../types/enum.types";

const paymentMadeSchmea = new Schema<IPaymentMade>(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
    },
    bankCharge: {
      type: Number,
      default: 0,
    },
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    paymentId: {
      type: String,
    },
    paymentMode: {
      type: String,
      required: false,
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    note: {
      type: String,
      default: null,
    },
    reference: {
      type: String,
      default: null,
    },
    documents: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: commonStatus,
    },
  },
  {
    timestamps: true,
  }
);

paymentMadeSchmea.add(BaseSchemaFields);

const paymentMadeModel: Model<IPaymentMade> = model(
  "PaymentMade",
  paymentMadeSchmea
);

export default paymentMadeModel;

export type PaymentMadeModelDocument = typeof paymentMadeModel;

export const PaymentMadeModelConstants = {
  vendorId: "vendorId",
  branchId: "branchId",
  amount: "amount",
  date: "date",
  bankCharge: "bankCharge",
  paymentId: "paymentId",
  paymentMode: "paymentMode",
  accountId: "accountId",
  note: "note",
  createdBy: "createdBy",
  isDeleted: "isDeleted",
  reference: "reference",
  documents: "documents",
  status: "status",
} as const;
