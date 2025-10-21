import mongoose, { Schema, model } from "mongoose";
import { IPermission } from "../types/common.types"; // path where you store it

const permissionSchema = new Schema<IPermission>(
  {
    name: { type: String, required: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
    permissions: [
      {
        module: { type: String, required: true },
        moduleFullAccess: { type: Boolean, default: false },
        actions: {
          can_create: { type: Boolean, default: false },
          can_read: { type: Boolean, default: false },
          can_update: { type: Boolean, default: false },
          can_delete: { type: Boolean, default: false },
        },
      },
    ],
    fullAdminAccess: { type: Boolean, default: false },
    User: { type: Schema.Types.ObjectId, ref: "User", default:null},
    createdBy: { type: String },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedById: { type: Schema.Types.ObjectId, ref: "User", default: null },
    deletedBy: { type: String, default: null },
  },
  { timestamps: true }
);

permissionSchema.index(
  { name: 1, branchId: 1 },
);

permissionSchema.index({ branchId: 1, isDeleted: 1 });

export default mongoose.model<IPermission>("Permission", permissionSchema);
