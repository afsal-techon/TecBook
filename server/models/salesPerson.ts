import mongoose, { Schema, Model, mongo } from "mongoose";
import { ISalesPerson } from "../types/common.types";

const salesPersonSchema = new Schema<ISalesPerson>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required:true},
    name: { type: String, default: null },
    email: { type: String, default: null},
    createdById:{ type:String , default: null},
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedById: { type: Schema.Types.ObjectId, ref: "User", default: null },
    deletedBy: { type: String, default: null },
  },
  {
    timestamps: true, // Automatically adds createdAt & updatedAt
  }
);

salesPersonSchema.index({ branchId: 1, name: 1 });
salesPersonSchema.index({ branchId: 1,email: 1 });
salesPersonSchema.index({ branchId: 1,email: 1 ,isDeleted:1 });

const salesPersonModel: Model<ISalesPerson> = mongoose.model<ISalesPerson>(
  "SalesPerson",
  salesPersonSchema
);

export default salesPersonModel;
