import mongoose, { Schema, Model } from "mongoose";
import { IProject } from "../types/common.types";

const projectSchema = new Schema<IProject>(
  {
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    projectName: {
      type: String,
      required: true,
      trim: true,
    },
    projectId: {
      type: String,
      trim: true,
      default: null,
    },
    billingMethod: {
      type: String,
      enum: [
        "Fixed Cost for Project",
        "Based on Project Hours",
        "Based on Task Hours",
        "Based on Staff Hours",
      ],
      required: true,
    },
    description: {
      type: String,
      default: null,
    },
    users: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
        email: { type: String, trim: true },
        ratePerHour: {
          type: Number,
          default: 0,
        },
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
        taskName: { type: String, trim: true },
        description: { type: String, trim: true },
        ratePerHour: { type: Number, default: 0 }, // Only used in Task Hour method
        billable: { type: Boolean, default: true },
      },
    ],
    costBudget: {
      type: Number,
      default: 0,
    },
    revenueBudget: {
      type: Number,
      default: 0,
    },
    status:{
      type:String,
      enum: [
        "In progress",
        "Completed",
        "Not started",
         "Cancelled",
      ],
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

projectSchema.index({ branchId: 1, isDeleted: 1, createdAt: -1 });
projectSchema.index({ customerId: 1, isDeleted: 1 });
projectSchema.index({ projectName: 1, branchId: 1 });

const projectModel: Model<IProject> = mongoose.model<IProject>(
  "Project",
  projectSchema
);
export default projectModel;
