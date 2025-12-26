import mongoose, { Schema, Model } from "mongoose";
import { IPaymentModes } from "../types/common.types";

const paymentModeSchema = new Schema<IPaymentModes>(
  {
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      unique: true, //  one doc per branch
    },

    paymentModes: [
      {
        paymentMode: { type: String,  trim: true },
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },

    createdById: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    deletedById: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    deletedBy: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const paymentModel: Model<IPaymentModes> = mongoose.model<IPaymentModes>(
  "PaymentMode",
  paymentModeSchema
);

export default paymentModel;
