"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemsSchemaFields = void 0;
const mongoose_1 = require("mongoose");
exports.ItemsSchemaFields = {
    items: [
        {
            taxId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "Tax",
                default: null,
            },
            itemId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "Item",
                default: null,
            },
            itemName: {
                type: String,
                required: true,
            },
            qty: {
                type: Number,
                default: 1,
            },
            tax: {
                type: Number,
                default: 0,
            },
            rate: {
                type: Number,
                default: 0,
            },
            amount: {
                type: Number,
                default: 0,
            },
            unit: {
                type: String,
                default: "",
            },
            discount: {
                type: Number,
                default: 0,
            },
        },
    ],
};
