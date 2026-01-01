import { Document, Model, model, Schema } from "mongoose";
import { IPaymentMade } from "../Interfaces/paymentMade.interface";
import { BaseSchemaFields } from "./common/BaseSchemaFields";

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
    paymentModeId: {
      type: Schema.Types.ObjectId,
      ref: "PaymentMode",
      required: true,
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
  },
  {
    timestamps: true,
  }
);

paymentMadeSchmea.add(BaseSchemaFields)

const paymentModel: Model<IPaymentMade> = model(
  "PaymentMade",
  paymentMadeSchmea
);

export default paymentModel;

export type PaymentMadeModelDocument = typeof paymentModel & Document;

export const PaymentMadeModelConstants  = {
    vendorId:'vendorId',
    branchId:'branchId',
    amount:'amount',
    date:'date',
    bankCharge:'bankCharge',
    paymentId:'paymentId',
    paymentModeId:'paymentModeId',
    accountId:'accountId',
    note:'note',
    createdBy:'createdBy',
    isDeleted:'isDeleted',
} as const;