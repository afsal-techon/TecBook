"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseOrderModelConstants = exports.PurchaseOrderModel = void 0;
const mongoose_1 = require("mongoose");
const BaseSchemaFields_1 = require("./common/BaseSchemaFields");
const ItemsSchemaFields_1 = require("./common/ItemsSchemaFields");
const enum_types_1 = require("../types/enum.types");
const PurchaseOrderSchema = new mongoose_1.Schema({
    purchaseOrderId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    vendorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Vendor",
        default: null,
    },
    quote: {
        type: String,
        required: false,
        trim: true,
    },
    purchaseOrderDate: {
        type: Date,
        required: true,
    },
    expDate: {
        type: Date,
        required: true,
    },
    salesPersonId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "SalesPeople",
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
        enum: enum_types_1.commonStatus
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
    paymentTermsId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "PaymentTerm",
        default: null,
    },
}, { timestamps: true });
PurchaseOrderSchema.add(BaseSchemaFields_1.BaseSchemaFields);
PurchaseOrderSchema.add(ItemsSchemaFields_1.ItemsSchemaFields);
exports.PurchaseOrderModel = (0, mongoose_1.model)("PurchaseOrder", PurchaseOrderSchema);
exports.PurchaseOrderModelConstants = {
    purchaseOrderId: "purchaseOrderId",
    vendorId: "vendorId",
    quote: "quote",
    purchaseOrderDate: "purchaseOrderDate",
    expDate: "expDate",
    salesPersonId: "salesPersonId",
    projectId: "projectId",
    branchId: "branchId",
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
    paymentTermsId: "paymentTermsId",
};
