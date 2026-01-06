"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentMadeModelConstants = void 0;
const mongoose_1 = require("mongoose");
const BaseSchemaFields_1 = require("./common/BaseSchemaFields");
const enum_types_1 = require("../types/enum.types");
const paymentMadeSchmea = new mongoose_1.Schema({
    vendorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Vendor",
        required: true,
    },
    branchId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Branch",
        default: null,
    },
    bankCharge: {
        type: Number,
        default: 0,
    },
    amount: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    paymentId: {
        type: String,
    },
    paymentMode: {
        type: String,
        required: false,
    },
    accountId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Account",
        required: true,
    },
    note: {
        type: String,
        default: null,
    },
    reference: {
        type: String,
        default: null,
    },
    documents: {
        type: [String],
        default: [],
    },
    status: {
        type: String,
        enum: enum_types_1.commonStatus,
    },
    billId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'BillingRecords',
        required: false,
        default: null
    }
}, {
    timestamps: true,
});
paymentMadeSchmea.add(BaseSchemaFields_1.BaseSchemaFields);
const paymentMadeModel = (0, mongoose_1.model)("PaymentMade", paymentMadeSchmea);
exports.default = paymentMadeModel;
exports.PaymentMadeModelConstants = {
    vendorId: "vendorId",
    branchId: "branchId",
    amount: "amount",
    date: "date",
    bankCharge: "bankCharge",
    paymentId: "paymentId",
    paymentMode: "paymentMode",
    accountId: "accountId",
    note: "note",
    createdBy: "createdBy",
    isDeleted: "isDeleted",
    reference: "reference",
    documents: "documents",
    status: "status",
};
