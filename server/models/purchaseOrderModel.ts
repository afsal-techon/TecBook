import { model, Schema } from "mongoose";
import { IPurchaseOrder } from "../Interfaces/purchase-order.interface";
import { BaseSchemaFields } from "./common/BaseSchemaFields";
import { ItemsSchemaFields } from "./common/ItemsSchemaFields";
import { PurchaseOrderDiscountType } from "../types/enum.types";

const PurchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    purchaseOrderId:{
        type:String,
        default:'',
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
      default: null,
    },
    quote: {
      type: String,
      required: false ,
      trim: true,
    },

    purchaseOrderDate: {
      type: Date,
      required: true,
    },

    expDate: {
      type: Date,
      required: true,
    },
    salesPersonId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: false,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    note:{
        type:String,
        default:null
    },
    terms:{
        type:String,
        default:null
    },
    discountType:{
      type:String,
      enum:PurchaseOrderDiscountType,
      default:PurchaseOrderDiscountType.PERCENTAGE
    },
    discountValue:{
      type:Number,
      default:0,
    },
    vatValue:{
      type:Number,
      default:0,
    },
        status: {
      type: String,
      
      enum: ["Draft", "Sent","Accepted","Approved","Invoiced","Pending","Declined"],
    },
        documents: {
      type: [String],
      default: [],
    },
    subTotal: {
      type: Number,
      required: true,
      default: 0,
    },

    taxTotal: {
      type: Number,
      required: true,
      default: 0,
    },

    total: {
      type: Number,
      required: true,
      default: 0,
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


export const PurchaseOrderModelConstants = {
  purchaseOrderId: "purchaseOrderId",
  vendorId: "vendorId",
  quote: "quote",
  purchaseOrderDate: "purchaseOrderDate",
  expDate: "expDate",
  salesPersonId: "salesPersonId",
  projectId: "projectId",
  branchId: "branchId",
  items: "items",
  createdBy: "createdBy",
  isDeleted: "isDeleted",
  note:"note",
  terms:"terms",
  discountType:"discountType",
  discountValue:"discountValue",
  vatValue:"vatValue",
} as const;

export type PurchaseOrderField =
  keyof typeof PurchaseOrderModelConstants;
