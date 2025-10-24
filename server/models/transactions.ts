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
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    purchaseId: {
      type: Schema.Types.ObjectId,
      ref: "Purchase",
      default: null,
    },
    expenseId: {
      type: Schema.Types.ObjectId,
      ref: "Expense",
      default: null,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      default: null,
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
    },
    referenceId: {
      type: String, // e.g., "POS Bill Payment"
    },
    referenceType: {
      type: String,
    },
    totalBeforeVAT: {
      type: Number,
      default: 0,
    },
    vatAmount: {
      type: Number,
      default: 0,
    },
    paymentType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
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
  { timestamps: true } //  automatically adds createdAt & updatedAt
);

//  Indexes for faster lookups
transactionSchema.index({ branchId: 1 });
transactionSchema.index({ parentAccountId: 1 });
transactionSchema.index({ accountType: 1 });
transactionSchema.index({ accountName: 1 });
transactionSchema.index({ branchId: 1, isDeleted: 1 });

const transactionModel: Model<ITransactions> = mongoose.model<ITransactions>(
  "transaction",
  transactionSchema
);

export default transactionModel;
