import mongoose, { Schema, Model } from "mongoose";
import { IDepartment } from "../types/common.types";

const DepartmentSchema = new Schema<IDepartment>(
  {
     branchIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Branch",
      },
    ],
    dept_name: {
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

DepartmentSchema.index({ branchId: 1, dept_name: 1 });
DepartmentSchema.index({ branchId: 1, isDeleted: 1 });
DepartmentSchema.index({ dept_name: 1 });
DepartmentSchema.index({ "branchIds": 1 });

const departmentModel: Model<IDepartment> = mongoose.model<IDepartment>(
  "Department",
  DepartmentSchema
);
export default departmentModel;
