import mongoose, { Schema, Model, mongo } from "mongoose";
import { IVendor } from "../types/common.types";

const vendorSchema = new Schema<IVendor>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", default: null },
    name: { type: String, default: null },
    phone: { type: String, default: null},
    openingBalance: { type: Number, default:0 },
    billingInfo: {
        country: { type: String, default: null },
        billingAddress :{ type:String, default:null},
        city:{ type:String,default:null},
        zipCode:{ type:String,default:null}
    },
        shippingInfo: {
        country: { type: String, default: null },
        shippingAddress :{ type:String, default:null},
        city:{ type:String,default:null},
        zipCode:{ type:String,default:null}
    },
    taxTreatment:{ type:String,default:null},
    trn:{type:String, default:null},
    placeOfSupplay:{ type:String, default: null},
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

vendorSchema.index({ branchId: 1, name: 1 });
vendorSchema.index({ branchId: 1,phone: 1 });
vendorSchema.index({ branchId: 1,phone: 1 ,isDeleted:1 });

const employeeModel: Model<IVendor> = mongoose.model<IVendor>(
  "Vendor",
  vendorSchema
);

export default employeeModel;
