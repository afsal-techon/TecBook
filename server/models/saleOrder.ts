import mongoose, { Schema, Model } from "mongoose";
import { ISaleOrder } from "../types/common.types";

const saleOrderSchema = new Schema<ISaleOrder>(
  {
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
    },
    saleOrderId: {
      type: String,
      required: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
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
    saleOrderDate: {
      type: Date,
      default: null,
    },
    deliveryDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: [
        "Draft",
        "Closed",
        "Confirmed",
        "Accepted",
        "Approved",
        "Invoiced",
        "Pending",
      ],
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
    reference: {
      type: String,
      default: null,
    },
    documents: {
      type: [String],
      default: [],
    },
    paymentTerms: {
      _id: { type: String, default: null },
      termName: { type: String, default: null },
      days: { type: Number, default: 0 },
    },
    terms: {
      type: String,
      default: false,
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

saleOrderSchema.index({
  branchId: 1,
  isDeleted: 1,
  status: 1,
  quoteDate: -1,
  createdAt: -1,
});
saleOrderSchema.index({ customerId: 1, saleOrderDate: -1 });
saleOrderSchema.index({ salesPersonId: 1, deliveryDate: -1 });
saleOrderSchema.index({ branchId: 1, isDeleted: 1 });

const saleOrderModel: Model<ISaleOrder> = mongoose.model<ISaleOrder>(
  "SaleOrder",
  saleOrderSchema
);
export default saleOrderModel;
