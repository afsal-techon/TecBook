import mongoose, { Schema, Model } from "mongoose";
import { IPayment } from "../types/common.types";

const paymentRecievedSchema = new Schema<IPayment>(
  {
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
    },
    paymentId: {
      type: String,
      required: true,
    },
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
      default: null,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },
      projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
    paymentDate: {
      type: Date,
      default: null,
    },
    paymentRecieved: {
      type: Date,
      default: null,
    },
    amount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Paid", "Approved","Partially Paid","Draft"],
    },
    paymentMode: {
      type: String,
      required: true,
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      default: null,
    },
    reference: {
      type: String,
      default: null,
    },
    bankCharges: {
      type: Number,
      default: 0,
    },
    documents: {
      type: [String],
      default: [],
    },
    isReversed: {
      type: Boolean,
      default: false,
    },
    note: {
      type: String,
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
  { timestamps: true } //  automatically manages createdAt & updatedAt
);

paymentRecievedSchema.index({
  branchId: 1,
  isDeleted: 1,
  status: 1,
  paymentDate: -1,
  createdAt: -1,
});
paymentRecievedSchema.index({ customerId: 1, paymentRecieved: -1 });
paymentRecievedSchema.index({ branchId: 1, paymentRecieved: -1 });
paymentRecievedSchema.index({ paymentDate: -1 });
paymentRecievedSchema.index({ paymentId: 1 });
paymentRecievedSchema.index({ branchId: 1, isDeleted: 1 });

const paymentRecievedModel: Model<IPayment> = mongoose.model<IPayment>(
  "PaymentRecieved",
  paymentRecievedSchema
);
export default paymentRecievedModel;
