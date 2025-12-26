import mongoose, { Schema, Model } from "mongoose";
import { ITransactions } from "../types/common.types";

const transactionSchema = new Schema<ITransactions>(
  {
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
    },

    accountId: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },

    transactionType: {
      type: String,
      enum: ["Debit", "Credit"],
      required: true,
    },

    transactionDate: {
      type: Date,
      default: null,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    reference: {
      type: String,
      default: null,
    },

    description: {
      type: String,
      default: null,
    },
    isReversed: {
      type: Boolean,
      default: false,
    },

    //  Optional relations
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },

    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
      default: null,
    },

    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
      default: null,
    },

    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "PaymentRecieved",
      default: null,
    },

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


transactionSchema.index({
  branchId: 1,
  isDeleted: 1,
  createdAt: -1,
});

transactionSchema.index({ paymentId: 1, isReversed: 1 });

transactionSchema.index({ accountId: 1 });
transactionSchema.index({ customerId: 1 });
transactionSchema.index({ vendorId: 1 });
transactionSchema.index({ reference: 1 });
transactionSchema.index({ invoiceId: 1 });
transactionSchema.index({ paymentId: 1 });

const transactionModel: Model<ITransactions> = mongoose.model<ITransactions>(
  "Transaction",
  transactionSchema
);
export default transactionModel;