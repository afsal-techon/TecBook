import mongoose, { Schema, Model } from "mongoose";
import { ILogEntry } from "../types/common.types";

const timeLogSchema = new Schema<ILogEntry>(
  {
    // branchId: {
    //   type: Schema.Types.ObjectId,
    //   ref: "Branch",
    //   required: true,
    // },
    date: {
      type: Date,
      required: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startTime: { type: Date, default: null },
    endTime: { type: Date, default: null },
    timeSpend: { type: Date, default: null },
    billable: {
      type: Boolean,
      default: true,
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

const timeLogModel: Model<ILogEntry> = mongoose.model<ILogEntry>(
  "LogTime",
  timeLogSchema
);
export default timeLogModel;
