"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreditNoteModelConstants = exports.CreditNoteModel = void 0;
const mongoose_1 = require("mongoose");
const BaseSchemaFields_1 = require("./common/BaseSchemaFields");
const ItemsSchemaFields_1 = require("./common/ItemsSchemaFields");
const enum_types_1 = require("../types/enum.types");
const creditNoteSchema = new mongoose_1.Schema({
    branchId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Branch",
        required: true,
    },
    customerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    salesPersonId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "SalesPeople",
        required: true,
    },
    creditNoteNumber: {
        type: String,
        required: false,
    },
    subject: {
        type: String,
        required: false,
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
        enum: enum_types_1.CreditNoteStatus,
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
        required: false,
        default: 0,
    },
    receivedAmount: {
        type: Number,
        required: false,
        default: 0,
    },
}, {
    timestamps: true,
});
creditNoteSchema.add(BaseSchemaFields_1.BaseSchemaFields);
creditNoteSchema.add(ItemsSchemaFields_1.ItemsSchemaFields);
exports.CreditNoteModel = (0, mongoose_1.model)("CreditNote", creditNoteSchema);
exports.CreditNoteModelConstants = {
    branchId: "branchId",
    customerId: "customerId",
    date: "date",
    salesPersonId: "salesPersonId",
    creditNoteNumber: "creditNoteNumber",
    subject: "subject",
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
