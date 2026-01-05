"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemsSchemaFields = void 0;
const mongoose_1 = require("mongoose");
exports.ItemsSchemaFields = {
    items: [
        {
            itemId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "Item",
            },
            taxId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "Tax",
            },
            prevItemId: {
                type: mongoose_1.Schema.Types.ObjectId,
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
            customerId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "Customer",
                default: null,
            },
            accountId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "Account",
                default: null,
            },
            projectId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "Project",
                default: null,
            }
        },
    ],
};
