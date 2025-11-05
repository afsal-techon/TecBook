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
const transactionSchema = new mongoose_1.Schema({
    branchId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Branch",
        default: null,
    },
    accountId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Account",
        required: true,
    },
    purchaseId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Purchase",
        default: null,
    },
    expenseId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Expense",
        default: null,
    },
    customerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Customer",
        default: null,
    },
    supplierId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Supplier",
        default: null,
    },
    amount: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
    },
    referenceId: {
        type: String, // e.g., "POS Bill Payment"
    },
    referenceType: {
        type: String,
    },
    totalBeforeVAT: {
        type: Number,
        default: 0,
    },
    vatAmount: {
        type: Number,
        default: 0,
    },
    paymentType: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Account",
        default: null,
    },
    isDeleted: {
        type: Boolean,
        default: false,
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
}, { timestamps: true } //  automatically adds createdAt & updatedAt
);
//  Indexes for faster lookups
transactionSchema.index({ branchId: 1 });
transactionSchema.index({ parentAccountId: 1 });
transactionSchema.index({ accountType: 1 });
transactionSchema.index({ accountName: 1 });
transactionSchema.index({ branchId: 1, isDeleted: 1 });
const transactionModel = mongoose_1.default.model("transaction", transactionSchema);
exports.default = transactionModel;
