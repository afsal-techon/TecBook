import mongoose, { Schema, Model } from "mongoose";
import { IUser } from "../types/user.types";

const userSchema = new Schema<IUser>({
  branchId: { type: Schema.Types.ObjectId, ref: "Branch", default: null },
  username: { type: String },
  password: { type: String },
  role: { type: String, enum: ["User", "CompanyAdmin"] },
  employeeId: {type: Schema.Types.ObjectId, ref: "Employee", default: null },
  permissions: [{ type: Schema.Types.ObjectId, ref: "Permission" }],
  status: { type: Boolean, default: true },
  createdById: { type: Schema.Types.ObjectId, ref: "User", default: null },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  deletedById: { type: Schema.Types.ObjectId, ref: "User", default: null },
  deletedBy: { type: String, default: null },
},{
    timestamps:true
});

userSchema.index({ branchId: 1});
userSchema.index({ branchId: 1, isDeleted: 1 });
userSchema.index({ username: 1 });

const userModel : Model<IUser> = mongoose.model<IUser>("User",userSchema);
export default userModel;