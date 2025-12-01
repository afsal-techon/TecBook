import mongoose, { Schema, Model } from "mongoose";
import { IPaymentTerms } from "../types/common.types";

const paymentTerms = new Schema<IPaymentTerms>(
  {
    branchId:
      {
        type: Schema.Types.ObjectId,
        ref: "Branch",
      },
    terms: [
      {
        termName: { type: String, trim: true },
        days: { type: Number, default: 0 },
        status: { type: Boolean, default: true },
      },
    ],
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
  { timestamps: true } //  automatically manages createdAt & updatedAt
);

paymentTerms.index({ branchId: 1, termName: 1, days:1 });
paymentTerms.index({ branchId: 1, isDeleted: 1 });
paymentTerms.index({ termName: 1 });

const paymentTermModel: Model<IPaymentTerms> = mongoose.model<IPaymentTerms>(
  "PaymentTerm",
  paymentTerms
);
export default paymentTermModel;
