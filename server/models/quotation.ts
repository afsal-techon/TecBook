import mongoose, { Schema, Model } from "mongoose";
import { IQuotes } from "../types/common.types";

const quotationSchema = new Schema<IQuotes>(
  {
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
    },
    quoteId: {
      type: String,
      required: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },
    projectId: {
      // type: Schema.Types.ObjectId,
      type:String,
      // ref: "Project",
      default: null,
    },
    salesPersonId: {
      type: Schema.Types.ObjectId,
      ref: "SalesPerson",
      default: null,
    },
    quoteDate: {
      type: Date,
      default: null,
    },
    expDate: {
      type: Date,
      default: null,
    },
      reference: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["Draft", "Sent","Accepted","Approved","Invoiced","Pending","Declined"],
    },
    items: [
      {
        itemId: { type: Schema.Types.ObjectId, ref: "Item", default: null },
        itemName:{ type:String, required:true},
        qty: { type: Number, default: 1 },
        tax: { type: Number, default: 0 },
        rate: { type: Number, default: 0 },
        amount: { type: Number, default: 0 },
         unit: { type: String, default: 0 },
         discount: { type: Number, default: 0 },
      },
    ],
    subTotal: {
      type: Number,
      default: 1,
    },
    taxTotal: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
        terms: {
      type: String,
      default:'null'
    },
            note: {
      type: String,
      default:'null'
    },
    documents: {
      type: [String],
      default: [],
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
  { timestamps: true } //  automatically manages createdAt & updatedAt
);

quotationSchema.index(
  { branchId: 1, isDeleted: 1, status: 1, quoteDate: -1, createdAt: -1 }
);
quotationSchema.index({ customerId: 1, quoteDate: -1 });
quotationSchema.index({ salesPersonId: 1, quoteDate: -1 });
quotationSchema.index({ branchId: 1, isDeleted: 1 });


const quottionModel: Model<IQuotes> = mongoose.model<IQuotes>(
  "Quotation",
  quotationSchema
);
export default quottionModel;
