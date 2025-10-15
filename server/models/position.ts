import mongoose, { Schema, Model } from "mongoose";
import { IPosition } from "../types/common.types";

const PositionSchema = new Schema<IPosition>(
  {
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    pos_name: {
      type: String,
      trim: true,
    },
    createdById: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
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
  { timestamps: true } //  automatically adds createdAt & updatedAt
);

//  Indexes for faster lookups
PositionSchema.index({ branchId: 1, departmentId: 1, pos_name: 1 });
PositionSchema.index({ branchId: 1, isDeleted: 1 });
PositionSchema.index({ pos_name: 1 });

const positionModel: Model<IPosition> = mongoose.model<IPosition>(
  "Position",
  PositionSchema
);

export default positionModel;
