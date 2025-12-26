"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseOrderModelConstants = exports.PurchaseOrderModel = void 0;
const mongoose_1 = require("mongoose");
const BaseSchemaFields_1 = require("./common/BaseSchemaFields");
const ItemsSchemaFields_1 = require("./common/ItemsSchemaFields");
const PurchaseOrderSchema = new mongoose_1.Schema({
    purchaseOrderNumber: {
        type: Number,
        default: 0,
        unique: true
    },
    vendorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Vendor",
        default: null,
    },
    quoteNumber: {
        type: String,
        required: true,
        trim: true,
    },
    quoteDate: {
        type: Date,
        required: true,
    },
    expiryDate: {
        type: Date,
        required: true,
    },
    salesmanId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    projectId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Project",
        required: false,
    },
    branchId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Branch",
        required: true,
    },
}, { timestamps: true });
PurchaseOrderSchema.add(BaseSchemaFields_1.BaseSchemaFields);
PurchaseOrderSchema.add(ItemsSchemaFields_1.ItemsSchemaFields);
exports.PurchaseOrderModel = (0, mongoose_1.model)("PurchaseOrder", PurchaseOrderSchema);
exports.PurchaseOrderModelConstants = {
    purchaseOrderNumber: "purchaseOrderNumber",
    vendorId: "vendorId",
    quoteNumber: "quoteNumber",
    quoteDate: "quoteDate",
    expiryDate: "expiryDate",
    salesmanId: "salesmanId",
    projectId: "projectId",
    branchId: "branchId",
    items: "items",
    createdBy: "createdBy",
    isDeleted: "isDeleted",
};
