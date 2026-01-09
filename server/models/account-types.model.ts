import { model, Schema } from "mongoose";
import { accountTypesCategory } from "../types/enum.types";
import { BaseSchemaFields } from "./common/BaseSchemaFields";
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
    isDeletable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

accountTypesSchema.add(BaseSchemaFields);
export const accountTypeModel = model<IAccountType>(
  "AccountType",
  accountTypesSchema
);
