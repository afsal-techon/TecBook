import mongoose, { Schema, Model } from "mongoose";
import { IQuoteNumberSetting } from "../types/common.types";

const quotationSchema = new Schema<IQuoteNumberSetting>(
  {
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
        prefix: {
      type: String,
      default: "QT-",
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


const quoteNumberModel: Model<IQuoteNumberSetting> = mongoose.model<IQuoteNumberSetting>(
  "QuoteNumberSetting",
  quotationSchema
);
export default quoteNumberModel;