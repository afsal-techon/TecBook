import mongoose, { Schema, Model } from "mongoose";
import { IPosition } from "../types/common.types";

const PositionSchema = new Schema<IPosition>(
  {
    branchIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Branch",
      },
    ],
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
PositionSchema.index({ branchIds: 1, departmentId: 1, pos_name: 1 });
PositionSchema.index({ branchIds: 1, isDeleted: 1 });
PositionSchema.index({ pos_name: 1 });
PositionSchema.index({ "branchIds": 1 });
PositionSchema.index({ departmentId: 1, isDeleted: 1 });


const positionModel: Model<IPosition> = mongoose.model<IPosition>(
  "Position",
  PositionSchema
);

export default positionModel;
