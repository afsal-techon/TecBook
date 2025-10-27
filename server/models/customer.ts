import mongoose, { Schema, Model, mongo } from "mongoose";
import { ICustomer } from "../types/common.types";

const customerSchema = new Schema<ICustomer>(
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

customerSchema.index({ branchId: 1, name: 1 });
customerSchema.index({ branchId: 1,phone: 1 });

const employeeModel: Model<ICustomer> = mongoose.model<ICustomer>(
  "Customer",
  customerSchema
);

export default employeeModel;
