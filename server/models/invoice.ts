import mongoose, { Schema, Model } from "mongoose";
import { IInvoice } from "../types/common.types";

const invoiceSchema = new Schema<IInvoice>(
  {
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
    },
    invoiceId: {
      type: String,
      required: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },
      quoteId: {
      type: Schema.Types.ObjectId,
      ref: "Quotation",
      default: null,
    },
    salesPersonId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
      projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
    invoiceDate: {
      type: Date,
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["Draft", "Sent","Confirmed","Paid", "Accepted", "Approved", "Invoiced","Partially Paid"],
    },
    items: [
      {
        itemId: { type: Schema.Types.ObjectId, ref: "Item", default: null },
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
     orderNumber: {
      type: String,
      default: null,
    },
       subject: {
      type: String,
      default: null,
    },
    documents: {
      type: [String],
      default: [],
    },
        paymentTerms: {
         _id:{type:String , default:null},
        termName: { type: String, default: null },
        days :{ type:Number, default:0},
    },
    terms:{
      type:String,
      default:false
    },
    note: {
      type: String,
      default: "null",
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

invoiceSchema.index({
  branchId: 1,
  isDeleted: 1,
  status: 1,
  invoiceDate: -1,
  createdAt: -1,
});
invoiceSchema.index({ customerId: 1, saleOrderDate: -1 });
invoiceSchema.index({ salesPersonId: 1, dueDate: -1 });
invoiceSchema.index({ branchId: 1, isDeleted: 1 });

const invoiceModel: Model<IInvoice> = mongoose.model<IInvoice>(
  "Invoice",
  invoiceSchema
);
export default invoiceModel;
