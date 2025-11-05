import mongoose, { Schema, Model } from "mongoose";
import { IItem } from "../types/common.types";

const itemSchema = new Schema<IItem>(
  {
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    name:{
        type:String,
        default:null,
        trim: true,
    },
    unitId: {
      type: Schema.Types.ObjectId,
      ref: "Unit",
      default: null,
    },
        taxId: {
      type: Schema.Types.ObjectId,
      ref: "Tax",
      default: null,
    },
    type: {
      type: String,
      default: null,
    },
    salesInfo: {
      sellingPrice: { type: Number, default: null },
      accountId: { type: Schema.Types.ObjectId, ref: "Account", default: null },
      description: { type: String, default: null },
    },
    purchaseInfo: {
      costPrice: { type: Number, default: null },
      accountId: { type: Schema.Types.ObjectId, ref: "Account", default: null },
      description: { type: String, default: null },
    },
    sellable:{
        type:Boolean,
        default:false
    },
     purchasable:{
        type:Boolean,
        default:false
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


itemSchema.index({ branchId: 1, isDeleted: 1 });
itemSchema.index({ categoryId: 1, isDeleted: 1 });
itemSchema.index({ branchId: 1, sellable: 1, isDeleted: 1 });
itemSchema.index({ branchId: 1, purchasable: 1, isDeleted: 1 });
itemSchema.index({ type: 1, branchId: 1, isDeleted: 1 });
itemSchema.index({ branchId: 1, name: 1, isDeleted: 1 });


const itemModel: Model<IItem> = mongoose.model<IItem>("Item", itemSchema);
export default itemModel;
