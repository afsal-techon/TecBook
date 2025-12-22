import { Schema, Types } from "mongoose";

// Common fields for all schemas
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

export const BaseSchema = new Schema(BaseSchemaFields, {
  _id: false,
});
