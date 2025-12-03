import mongoose, { Schema, Model } from "mongoose";
import { IProject } from "../types/common.types";

const proejctSchema = new Schema<IProject>(
  {
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },
    projectName: {
      type: String,
      default: null,
    },
    projectCode: {
      type: String,
      default: null,
    },
    billingMethod:{
        type:String,
        default:null
    },
    descriptoin: {
      type: String,
      default: null,
    },
    users: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
        email: { type: String, default: null },
      },
    ],
    projectCost: {
      type: Number,
      default: 0,
    },
    ratePerHour: {
      type: Number,
      default: 0,
    },
       tasks: [
      {
        taskName: { type: String, default: null },
         description: { type: String, default: null },
          ratePerHour: { type: Number, default: 0 },
           billable: { type: Boolean, default: true },
      },
    ],
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

proejctSchema.index({
  branchId: 1,
  isDeleted: 1,
  status: 1,
  quoteDate: -1,
  createdAt: -1,
});
proejctSchema.index({ customerId: 1, quoteDate: -1 });
proejctSchema.index({ salesPersonId: 1, quoteDate: -1 });
proejctSchema.index({ branchId: 1, isDeleted: 1 });

const quottionModel: Model<IProject> = mongoose.model<IProject>(
  "Quotation",
  proejctSchema
);
export default quottionModel;
