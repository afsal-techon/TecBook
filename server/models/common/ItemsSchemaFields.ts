import { Schema } from "mongoose";

export const ItemsSchemaFields = {
  items: [
    {
      itemId: {
        type: Schema.Types.ObjectId,
        ref: "Item",
      },

      taxId: {
        type: Schema.Types.ObjectId,
        ref: "Tax",
      },

      prevItemId: {
        type: Schema.Types.ObjectId,
        ref: "Item",
        default: null,
      },

      itemName: {
        type: String,
        trim: true,
      },

      qty: {
        type: Number,
        min: 1,
      },

      rate: {
        type: Number,
        min: 0,
      },

      amount: {
        type: Number,
        min: 0,
      },

      unit: {
        type: String,
      },

      discount: {
        type: Number,
        default: 0,
        min: 0,
      },
      customerId:{
        type: Schema.Types.ObjectId,
        ref: "Customer",
        default: null,
      },
      accountId:{
        type: Schema.Types.ObjectId,
        ref: "Account",
        default: null,
      }
    },
  ],
};
