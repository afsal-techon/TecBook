"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const saleOrderSchema = new mongoose_1.Schema({
    branchId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Branch",
        default: null,
    },
    saleOrderId: {
        type: String,
        required: true,
    },
    customerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Customer",
        default: null,
    },
    salesPersonId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Employee",
        default: null,
    },
    saleOrderDate: {
        type: Date,
        default: null,
    },
    deliveryDate: {
        type: Date,
        default: null,
    },
    status: {
        type: String,
        enum: ["Draft", "Closed", "Confirmed", "Accepted", "Approved", "Invoiced", "Pending"],
    },
    items: [
        {
            itemId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Item", default: null },
            qty: { type: Number, default: 1 },
            tax: { type: Number, default: 0 },
            rate: { type: Number, default: 0 },
            amount: { type: Number, default: 0 },
            unit: { type: String, default: 0 },
            discount: { type: Number, default: 0 },
        },
    ],
    subTotal: {
        type: Number,
        default: 1,
    },
    taxTotal: {
        type: Number,
        default: 0,
    },
    total: {
        type: Number,
        default: 0,
    },
    discount: {
        type: Number,
        default: 0,
    },
    reference: {
        type: String,
        default: null,
    },
    documents: {
        type: [String],
        default: [],
    },
    paymentTerms: {
        _id: { type: String, default: null },
        termName: { type: String, default: null },
        days: { type: Number, default: 0 },
    },
    terms: {
        type: String,
        default: false
    },
    note: {
        type: String,
        default: "null",
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    createdById: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    deletedAt: {
        type: Date,
        default: null,
    },
    deletedById: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    deletedBy: {
        type: String,
        default: null,
    },
}, { timestamps: true } //  automatically manages createdAt & updatedAt
);
saleOrderSchema.index({
    branchId: 1,
    isDeleted: 1,
    status: 1,
    quoteDate: -1,
    createdAt: -1,
});
saleOrderSchema.index({ customerId: 1, saleOrderDate: -1 });
saleOrderSchema.index({ salesPersonId: 1, deliveryDate: -1 });
saleOrderSchema.index({ branchId: 1, isDeleted: 1 });
const saleOrderModel = mongoose_1.default.model("SaleOrder", saleOrderSchema);
exports.default = saleOrderModel;
