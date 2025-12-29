import mongoose, { Schema, Model, mongo } from "mongoose";
import { ICustomer } from "../types/common.types";

const customerSchema = new Schema<ICustomer>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", default: null },
    name: { type: String, default: null },
    phone: { type: String, default: null},
    email: { type: String, default: null},
    openingBalance: { type: Number, default:0 },
     currency: { type: String, default:null },
      paymentTerms: { type: String, default:false},
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
        //  documents field (array of name + file)
    documents: [
      {
        doc_name: { type: String, default: null },
        doc_file: { type: String, default: null },
        doc_typeId: {
          type: Schema.Types.ObjectId,
          ref: "DocumentType",
          default: null,
        },
        startDate :{ type:Date, default:null},
        endDate:{ type:Date,default:null}
      },
    ],
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
customerSchema.index({ branchId: 1,phone: 1 ,isDeleted:1 });

const customerModel: Model<ICustomer> = mongoose.model<ICustomer>(
  "Customer",
  customerSchema
);

export default customerModel;
