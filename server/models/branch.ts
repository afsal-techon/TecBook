import mongoose, { Schema, Model } from "mongoose";
import { IBranch } from "../types/common.types";


const branchSchema = new Schema<IBranch>({
  companyAdminId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  branchName: { type: String },
  trn: { type: String ,default:null},
  city: { type: String ,default:null},
  phone: { type: String ,default:null},
  landline: { type: String,default:null},
  state: { type: String ,default:null},
  address: { type: String ,default:null},
  country: { type: String ,default:null},
  logo: { type: String ,default:null},
  // vatPercentage: [{ type: String }],
  currency: { type: String,default:null },
  currencySymbol: { type: String,default:null },
  status: { type: Boolean ,default:true},
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  deletedById: { type: Schema.Types.ObjectId, ref: "User", default: null },
  deletedBy: { type: String, default: null },
},{
    timestamps:true
});

branchSchema.index({ companyAdminId: 1, branchName: 1 });
branchSchema.index({ branchName: 1 });
branchSchema.index({ isDeleted:1})


const branchModel : Model<IBranch> = mongoose.model<IBranch>("Branch",branchSchema);
export default branchModel;