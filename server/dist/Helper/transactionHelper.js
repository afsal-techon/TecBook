"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTransaction = void 0;
const transactions_1 = __importDefault(require("../models/transactions"));
const createTransaction = async ({ branchId, accountId, transactionType, amount, paymentMode, reference, paymentId, description, customerId, transactionDate, vendorId, createdById, }) => {
    if (amount <= 0)
        return;
    await transactions_1.default.create({
        branchId,
        accountId,
        transactionType,
        amount,
        paymentMode,
        reference,
        paymentId,
        transactionDate,
        description,
        customerId: customerId || null,
        vendorId: vendorId || null,
        createdById,
    });
};
exports.createTransaction = createTransaction;
