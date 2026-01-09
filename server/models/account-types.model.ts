import { Document, model, Schema } from "mongoose";
import { accountTypesCategory } from "../types/enum.types";
import { IAccountType } from "../Interfaces/account-type.interface";

const accountTypesSchema = new Schema<IAccountType>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    code: {
      type: String,
      required: false,
      unique: true,
    },
    category: {
      type: String,
      enum: accountTypesCategory,
    },
    description: {
      type: String,
      required: false,
    },
    isSystemGenerated: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const accountTypeModel = model<IAccountType>(
  "AccountType",
  accountTypesSchema
);

export type accountTypeModelDocument = typeof accountTypeModel;
