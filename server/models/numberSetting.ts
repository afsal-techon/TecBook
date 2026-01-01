import mongoose, { Schema, Model } from "mongoose";
import { INumberSetting } from "../types/common.types";

const numberSchema = new Schema<INumberSetting>(
  {
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
       docType: {
      type: String,
      enum: ["QUOTE", "SALE_ORDER", "INVOICE","PAYMENT" ,'PURCHASE_ORDER'], // add more if needed
      required: true,
    },
        prefix: {
      type: String,
      default: "DOC-",
      trim: true,
    },
    nextNumber: {
      type: Number,
      default: 1,
    },
    nextNumberRaw: { type: String, default: "1" }, 
  mode: { type: String, enum: ["Auto", "Manual"], default: "Auto" },
   
  },
  { timestamps: true } //  automatically manages createdAt & updatedAt
);


const numberSettingModel: Model<INumberSetting> = mongoose.model<INumberSetting>(
  "NumberSetting",
  numberSchema
);
export default numberSettingModel;