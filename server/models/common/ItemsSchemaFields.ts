import { Schema } from "mongoose";

export const ItemsSchemaFields = {
  items: [
    {
      taxId: { type: Schema.Types.ObjectId, ref: "Tax", default: null },
      itemId: { type: Schema.Types.ObjectId, ref: "Item", default: null },
      itemName: { type: String, required: true },
      qty: { type: Number, default: 1 },
      tax: { type: Number, default: 0 },
      rate: { type: Number, default: 0 },
      amount: { type: Number, default: 0 },
      unit: { type: String, default: 0 },
      discount: { type: Number, default: 0 },
    },
  ],
};
export const ItemsBaseSchema = new Schema(ItemsSchemaFields, {
  _id: false,
});
