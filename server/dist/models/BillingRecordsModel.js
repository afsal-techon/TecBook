"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingSchemaModelConstants = exports.BillingSchemaModel = void 0;
const mongoose_1 = require("mongoose");
const enum_types_1 = require("../types/enum.types");
const BaseSchemaFields_1 = require("./common/BaseSchemaFields");
const ItemsSchemaFields_1 = require("./common/ItemsSchemaFields");
const BillngRecordSchema = new mongoose_1.Schema({
    vendorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Vendor",
        required: true,
    },
    billNumber: {
        type: String,
        unique: true,
    },
    purchaseOrderNumber: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "PurchaseOrder",
        required: true,
    },
    billDate: {
        type: Date,
        required: true,
    },
    dueDate: {
        type: Date,
        required: true,
    },
    branchId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Branch",
        required: true,
    },
    payment: {
        type: String,
        enum: enum_types_1.BillingPaymentStatus,
        required: true,
    },
    note: {
        type: String,
        default: null,
    },
    terms: {
        type: String,
        default: null,
    },
    discountType: {
        type: String,
        enum: enum_types_1.PurchaseOrderDiscountType,
        default: enum_types_1.PurchaseOrderDiscountType.PERCENTAGE,
    },
    discountValue: {
        type: Number,
        default: 0,
    },
    vatValue: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: enum_types_1.commonStatus,
    },
    documents: {
        type: [String],
        default: [],
    },
    subTotal: {
        type: Number,
        required: true,
        default: 0,
    },
    taxTotal: {
        type: Number,
        required: true,
        default: 0,
    },
    total: {
        type: Number,
        required: true,
        default: 0,
    },
}, {
    timestamps: true,
});
BillngRecordSchema.add(BaseSchemaFields_1.BaseSchemaFields);
BillngRecordSchema.add(ItemsSchemaFields_1.ItemsSchemaFields);
exports.BillingSchemaModel = (0, mongoose_1.model)("BillingRecords", BillngRecordSchema);
exports.BillingSchemaModelConstants = {
    vendorId: "vendorId",
    billNumber: "billNumber",
    purchaseOrderNumber: "purchaseOrderNumber",
    billDate: "billDate",
    dueDate: "dueDate",
    branchId: "branchId",
    payment: "payment",
    items: "items",
    createdBy: "createdBy",
    isDeleted: "isDeleted",
    note: "note",
    terms: "terms",
    discountType: "discountType",
    discountValue: "discountValue",
    vatValue: "vatValue",
    status: "status",
    documents: "documents",
    subTotal: "subTotal",
    taxTotal: "taxTotal",
    total: "total",
};
