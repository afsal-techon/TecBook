import { Schema } from "mongoose";

// Common fields for ROOT schemas
export const BaseSchemaFields = {
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  isDeleted: {
    type: Boolean,
    default: false,
  },
};
