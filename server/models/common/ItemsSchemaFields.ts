import { Schema } from "mongoose";

export const ItemsSchemaFields = {
  items: [
    {
      itemId: {
        type: Schema.Types.ObjectId,
        ref: "Item",
        required: true,
      },

      taxId: {
        type: Schema.Types.ObjectId,
        ref: "Tax",
        required: true,
      },

      prevItemId: {
        type: Schema.Types.ObjectId,
        ref: "Item",
        default: null,
      },

      itemName: {
        type: String,
        required: true,
        trim: true,
      },

      qty: {
        type: Number,
        required: true,
        min: 1,
      },

      rate: {
        type: Number,
        required: true,
        min: 0,
      },

      amount: {
        type: Number,
        required: true,
        min: 0,
      },

      unit: {
        type: String,
        required: true,
      },

      discount: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
  ],
};
