import { model, Schema } from "mongoose";
import { IPurchaseOrder } from "../Interfaces/purchase-order.interface";
import { BaseSchemaFields } from "./common/BaseSchemaFields";
import { ItemsSchemaFields } from "./common/ItemsSchemaFields";

const PurchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    purchaseOrderNumber:{
        type:Number,
        default:0,
        unique:true
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
      default: null,
    },
    quoteNumber: {
      type: String,
      required: true,
      trim: true,
    },

    quoteDate: {
      type: Date,
      required: true,
    },

    expiryDate: {
      type: Date,
      required: true,
    },
    salesmanId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: false,
    },
  },
  { timestamps: true }
);


PurchaseOrderSchema.add(BaseSchemaFields);
PurchaseOrderSchema.add(ItemsSchemaFields);

export const PurchaseOrderModel = model<IPurchaseOrder>(
  "PurchaseOrder",
  PurchaseOrderSchema
);

export type PurchaseOrderModelDocument = typeof PurchaseOrderModel;