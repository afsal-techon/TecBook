"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpenseModelConstants = exports.ExpenseModel = void 0;
const mongoose_1 = require("mongoose");
const BaseSchemaFields_1 = require("./common/BaseSchemaFields");
const ItemsSchemaFields_1 = require("./common/ItemsSchemaFields");
const enum_types_1 = require("../types/enum.types");
const ExpenseModelSchema = new mongoose_1.Schema({
    date: {
        type: Date,
        required: true,
        default: Date.now(),
    },
    expenseNumber: {
        type: String,
        required: true,
        unique: true,
    },
    customerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
    },
    branchId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Branch",
        required: true,
    },
    taxPreference: {
        type: String,
        enum: enum_types_1.TaxPreferences,
        required: false,
    },
    paidAccount: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Account",
        required: true,
    },
    vendorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Vendor",
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
    projectId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Project',
        default: null
    },
    isBillable: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
});
ExpenseModelSchema.add(BaseSchemaFields_1.BaseSchemaFields);
ExpenseModelSchema.add(ItemsSchemaFields_1.ItemsSchemaFields);
exports.ExpenseModel = (0, mongoose_1.model)("ExpenseModel", ExpenseModelSchema);
exports.ExpenseModelConstants = {
    date: "date",
    expenseNumber: "expenseNumber",
    customerId: "customerId",
    branchId: "branchId",
    taxPreference: "taxPreference",
    paidAccount: "paidAccount",
    vendorId: "vendorId",
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
    projectId: 'projectId',
    isBillable: 'isBillable'
};
// export type ExpenseModelField = keyof typeof ExpenseModelConstants;
