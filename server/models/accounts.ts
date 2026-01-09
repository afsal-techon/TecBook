import mongoose, { Schema, Model } from "mongoose";
import { IAccounts } from "../types/common.types";

const accountSchema = new Schema<IAccounts>(
  {
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
    },
    accountName: {
      type: String,
      required: true,
      trim: true,
    },
    accountType: {
      type: Schema.Types.ObjectId,
      ref: "AccountType",
      required: true,
    },
    parentAccountId: {
      type: Schema.Types.ObjectId,
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
    isSystemGenerated: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true } //  automatically adds createdAt & updatedAt
);

//  Indexes for faster lookups
accountSchema.index({ branchId: 1 });
accountSchema.index({ parentAccountId: 1 });
accountSchema.index({ accountType: 1 });
accountSchema.index({ accountName: 1 });
accountSchema.index({ branchId: 1, isDeleted: 1 });

const accountModel: Model<IAccounts> = mongoose.model<IAccounts>(
  "Account",
  accountSchema
);

export default accountModel;
