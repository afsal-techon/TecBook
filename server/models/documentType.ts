import mongoose, { Schema, Model } from "mongoose";
import { IDocumentType } from "../types/common.types";

const documentSchema = new Schema<IDocumentType>(
  {
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
    },
    doc_type: {
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

documentSchema.index({ branchId: 1, dept_name: 1 });
documentSchema.index({ branchId: 1, isDeleted: 1 });
documentSchema.index({ doc_type: 1 });

const documentModel: Model<IDocumentType> = mongoose.model<IDocumentType>(
  "DocumentType",
  documentSchema
);
export default documentModel;
