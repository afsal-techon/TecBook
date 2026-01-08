"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vendorCreditModelConstants = exports.vendorCreditModel = exports.vendorCreditSchema = void 0;
const mongoose_1 = require("mongoose");
const ItemsSchemaFields_1 = require("./common/ItemsSchemaFields");
const BaseSchemaFields_1 = require("./common/BaseSchemaFields");
const enum_types_1 = require("../types/enum.types");
exports.vendorCreditSchema = new mongoose_1.Schema({
    vendorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Vendor",
    },
    vendorCreditNoteNumber: {
        type: String,
        required: true,
    },
    referenceNumber: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    subject: {
        type: String,
        required: true,
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
    balanceAmount: {
        type: Number,
        required: true,
        default: 0,
    },
}, {
    timestamps: true,
});
exports.vendorCreditSchema.add(ItemsSchemaFields_1.ItemsSchemaFields);
exports.vendorCreditSchema.add(BaseSchemaFields_1.BaseSchemaFields);
exports.vendorCreditModel = (0, mongoose_1.model)("vendorCredit", exports.vendorCreditSchema);
exports.vendorCreditModelConstants = {
    vendorId: "vendorId",
    vendorCreditNoteNumber: "vendorCreditNoteNumber",
    referenceNumber: "referenceNumber",
    date: "date",
    subject: "subject",
    branchId: "branchId",
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
    balanceAmount: "balanceAmount",
};
