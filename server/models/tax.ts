import mongoose, { Schema, Model, mongo } from "mongoose";
import { ITax } from "../types/common.types";

const taxSchema = new Schema<ITax>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", default: null },
    name: { type: String, default: null },
    type: { type: String, enum: ["GST", "VAT"], required: true },
     cgstRate: { type: Number, default: null },
    sgstRate: { type: Number, default: null },
    vatRate: { type: Number, default: null },
    description: { type: String, default: null },
    isActive: { type: Boolean, default: true },
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

taxSchema.index({ branchId: 1, name: 1 });
taxSchema.index({ branchId: 1,type: 1 });
taxSchema.index({ branchId: 1,name: 1 ,isDeleted:1 });
taxSchema.index({ branchId: 1,type: 1 ,isDeleted:1 });

const taxModel: Model<ITax> = mongoose.model<ITax>(
  "Tax",
  taxSchema
);

export default taxModel;
