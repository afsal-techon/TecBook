import mongoose, { Schema, Model } from "mongoose";
import { IUnit } from "../types/common.types";

const UnitSchema = new Schema<IUnit>(
  {
    branchIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Branch",
      },
    ],
    unit: {
      type: String,
      trim: true,
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

UnitSchema.index({ branchId: 1, unit: 1 });
UnitSchema.index({ branchId: 1, isDeleted: 1 });
UnitSchema.index({ unit: 1 });

const unitModel: Model<IUnit> = mongoose.model<IUnit>(
  "Unit",
  UnitSchema
);
export default unitModel;
