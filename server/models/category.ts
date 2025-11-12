import mongoose, { Schema, Model, mongo } from "mongoose";
import { ICategory } from "../types/common.types";

const categorySchema = new Schema<ICategory>(
  {
      branchIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Branch",
      },
    ],
    name: { type: String, default: null },
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

categorySchema.index({ name: 1, branchIds: 1, isDeleted: 1 });

const categoryModel: Model<ICategory> = mongoose.model<ICategory>(
  "Category",
  categorySchema
);

export default categoryModel;
