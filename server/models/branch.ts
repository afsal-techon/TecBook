import mongoose, { Schema, Model } from "mongoose";
import { IBranch } from "../types/common.types";


const branchSchema = new Schema<IBranch>({
  comapnyAdminId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  branchName: { type: String },
  email: { type: String },
  branchCode: { type:String},
  city: [{ type: String }],
  contact1: [{ type: String }],
  contact2: [{ type: String }],
  state: [{ type: String }],
  address: [{ type: String }],
  country: [{ type: String }],
  logo: [{ type: String }],
  vatPercentage: [{ type: String }],
  currency: [{ type: String }],
  currencySymbol: [{ type: String }],
  status: [{ type: String }],
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  deletedById: { type: Schema.Types.ObjectId, ref: "User", default: null },
  deletedBy: { type: String, default: null },
},{
    timestamps:true
});

branchSchema.index({ comapnyAdminId: 1, branchName: 1 });
branchSchema.index({ branchName: 1 });


const branchModel : Model<IBranch> = mongoose.model<IBranch>("Branch",branchSchema);
export default branchModel;