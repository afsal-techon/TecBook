"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_ACCOUNT_TYPES = void 0;
const enum_types_1 = require("../types/enum.types");
exports.DEFAULT_ACCOUNT_TYPES = [
    //assets
    {
        name: "Other Asset",
        category: enum_types_1.accountTypesCategory.ASSET,
        isSystemGenerated: true,
    },
    {
        name: "Other Current Asset",
        category: enum_types_1.accountTypesCategory.ASSET,
        isSystemGenerated: true,
    },
    {
        name: "Cash",
        category: enum_types_1.accountTypesCategory.ASSET,
        isSystemGenerated: true,
    },
    {
        name: "Bank",
        category: enum_types_1.accountTypesCategory.ASSET,
        isSystemGenerated: true,
    },
    {
        name: "Fixed Asset",
        category: enum_types_1.accountTypesCategory.ASSET,
        isSystemGenerated: true,
    },
    {
        name: "Account Receivable",
        category: enum_types_1.accountTypesCategory.ASSET,
        isSystemGenerated: true,
    },
    {
        name: "Stock",
        category: enum_types_1.accountTypesCategory.ASSET,
        isSystemGenerated: true,
    },
    {
        name: "Payment Clearing Account",
        category: enum_types_1.accountTypesCategory.ASSET,
        isSystemGenerated: true,
    },
    {
        name: "Intangible Asset",
        category: enum_types_1.accountTypesCategory.ASSET,
        isSystemGenerated: true,
    },
    {
        name: "Non Current Asset",
        category: enum_types_1.accountTypesCategory.ASSET,
        isSystemGenerated: true,
    },
    {
        name: "Deferred Tax Asset",
        category: enum_types_1.accountTypesCategory.ASSET,
        isSystemGenerated: true,
    },
    //liability
    {
        name: "Other Current Liability",
        category: enum_types_1.accountTypesCategory.LIABILITY,
        isSystemGenerated: true,
    },
    {
        name: "Credit Card",
        category: enum_types_1.accountTypesCategory.LIABILITY,
        isSystemGenerated: true,
    },
    {
        name: "Non Current Liability",
        category: enum_types_1.accountTypesCategory.LIABILITY,
        isSystemGenerated: true,
    },
    {
        name: "Other Liability",
        category: enum_types_1.accountTypesCategory.LIABILITY,
        isSystemGenerated: true,
    },
    {
        name: "Accounts Payable",
        category: enum_types_1.accountTypesCategory.LIABILITY,
        isSystemGenerated: true,
    },
    {
        name: "Overseas Tax Payable",
        category: enum_types_1.accountTypesCategory.LIABILITY,
        isSystemGenerated: true,
    },
    {
        name: "Deferred Tax Liability",
        category: enum_types_1.accountTypesCategory.LIABILITY,
        isSystemGenerated: true,
    },
    //equity
    {
        name: "Equity",
        category: enum_types_1.accountTypesCategory.EQUITY,
        isSystemGenerated: true,
    },
    //income
    {
        name: "Income",
        category: enum_types_1.accountTypesCategory.INCOME,
        isSystemGenerated: true,
    },
    {
        name: "Other Income",
        category: enum_types_1.accountTypesCategory.INCOME,
        isSystemGenerated: true,
    },
    //expense
    {
        name: "Expense",
        category: enum_types_1.accountTypesCategory.EXPENSE,
        isSystemGenerated: true,
    },
    {
        name: "Cost Of Goods Sold",
        category: enum_types_1.accountTypesCategory.EXPENSE,
        isSystemGenerated: true,
    },
    {
        name: "Other Expense",
        category: enum_types_1.accountTypesCategory.EXPENSE,
        isSystemGenerated: true,
    },
];
