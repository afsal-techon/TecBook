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
const accountSchema = new mongoose_1.Schema({
    branchId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Branch",
        default: null,
    },
    accountName: {
        type: String,
        required: true,
        trim: true,
    },
    accountType: {
        type: String,
        enum: [
            "Asset",
            "Current Asset",
            "Cash",
            "Bank",
            "Card",
            "Due",
            "Online",
            "Fixed Asset",
            "Stock",
            "Other Current Liabilities",
            "Credit Card",
            "Liabilities",
            "Equity",
            "Income",
            "Other Income",
            "Purchase",
            "Expense",
            "Cost of Goods Sold",
            "Other Expenses",
            "Credit",
        ],
        required: true,
    },
    parentAccountId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
accountSchema.index({ branchId: 1 });
accountSchema.index({ parentAccountId: 1 });
accountSchema.index({ accountType: 1 });
accountSchema.index({ accountName: 1 });
accountSchema.index({ branchId: 1, isDeleted: 1 });
const accountModel = mongoose_1.default.model("Account", accountSchema);
exports.default = accountModel;
