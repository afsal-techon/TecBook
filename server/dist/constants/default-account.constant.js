"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_ACCOUNTS = void 0;
/**
 * System default accounts
 * accountTypeName MUST match AccountType.name exactly
 */
exports.DEFAULT_ACCOUNTS = [
    // ===== ASSETS =====
    {
        accountName: "Prepaid Expenses",
        accountTypeName: "Other Current Asset",
        isSystemGenerated: true,
    },
    {
        accountName: "TDS Receivable",
        accountTypeName: "Other Current Asset",
        isSystemGenerated: true,
    },
    {
        accountName: "Employee Advance",
        accountTypeName: "Other Current Asset",
        isSystemGenerated: true,
    },
    {
        accountName: "Advance Tax",
        accountTypeName: "Other Current Asset",
        isSystemGenerated: true,
    },
    {
        accountName: "Undeposited Funds",
        accountTypeName: "Cash",
        isSystemGenerated: true,
    },
    {
        accountName: "Petty Cash",
        accountTypeName: "Cash",
        isSystemGenerated: true,
    },
    {
        accountName: "Accounts Receivable",
        accountTypeName: "Account Receivable",
        isSystemGenerated: true,
    },
    {
        accountName: "Furniture and Equipment",
        accountTypeName: "Fixed Asset",
        isSystemGenerated: true,
    },
    // ===== LIABILITIES =====
    {
        accountName: "TDS Payable",
        accountTypeName: "Other Current Liability",
        isSystemGenerated: true,
    },
    {
        accountName: "Opening Balance Adjustments",
        accountTypeName: "Other Current Liability",
        isSystemGenerated: true,
    },
    {
        accountName: "Unearned Revenue",
        accountTypeName: "Other Current Liability",
        isSystemGenerated: true,
    },
    {
        accountName: "Employee Reimbursements",
        accountTypeName: "Other Current Liability",
        isSystemGenerated: true,
    },
    {
        accountName: "Tax Payable",
        accountTypeName: "Other Current Liability",
        isSystemGenerated: true,
    },
    {
        accountName: "Accounts Payable",
        accountTypeName: "Accounts Payable",
        isSystemGenerated: true,
    },
    {
        accountName: "Mortgages",
        accountTypeName: "Non Current Liability",
        isSystemGenerated: true,
    },
    {
        accountName: "Construction Loans",
        accountTypeName: "Non Current Liability",
        isSystemGenerated: true,
    },
    {
        accountName: "Dimension Adjustments",
        accountTypeName: "Other Liability",
        isSystemGenerated: true,
    },
    // ===== EQUITY =====
    {
        accountName: "Retained Earnings",
        accountTypeName: "Equity",
        isSystemGenerated: true,
    },
    {
        accountName: "Owner's Equity",
        accountTypeName: "Equity",
        isSystemGenerated: true,
    },
    {
        accountName: "Opening Balance Offset",
        accountTypeName: "Equity",
        isSystemGenerated: true,
    },
    {
        accountName: "Drawings",
        accountTypeName: "Equity",
        isSystemGenerated: true,
    },
    {
        accountName: "Investments",
        accountTypeName: "Equity",
        isSystemGenerated: true,
    },
    {
        accountName: "Distributions",
        accountTypeName: "Equity",
        isSystemGenerated: true,
    },
    {
        accountName: "Capital Stock",
        accountTypeName: "Equity",
        isSystemGenerated: true,
    },
    {
        accountName: "Dividends Paid",
        accountTypeName: "Equity",
        isSystemGenerated: true,
    },
    // ===== INCOME =====
    { accountName: "Sales", accountTypeName: "Income", isSystemGenerated: true },
    {
        accountName: "General Income",
        accountTypeName: "Income",
        isSystemGenerated: true,
    },
    {
        accountName: "Interest Income",
        accountTypeName: "Income",
        isSystemGenerated: true,
    },
    {
        accountName: "Other Charges",
        accountTypeName: "Income",
        isSystemGenerated: true,
    },
    {
        accountName: "Shipping Charge",
        accountTypeName: "Income",
        isSystemGenerated: true,
    },
    {
        accountName: "Late Fee Income",
        accountTypeName: "Income",
        isSystemGenerated: true,
    },
    {
        accountName: "Discount",
        accountTypeName: "Income",
        isSystemGenerated: true,
    },
    // ===== EXPENSE =====
    {
        accountName: "Travel Expense",
        accountTypeName: "Expense",
        isSystemGenerated: true,
    },
    {
        accountName: "Telephone Expense",
        accountTypeName: "Expense",
        isSystemGenerated: true,
    },
    {
        accountName: "Automobile Expense",
        accountTypeName: "Expense",
        isSystemGenerated: true,
    },
    {
        accountName: "IT and Internet Expenses",
        accountTypeName: "Expense",
        isSystemGenerated: true,
    },
    {
        accountName: "Rent Expense",
        accountTypeName: "Expense",
        isSystemGenerated: true,
    },
    {
        accountName: "Janitorial Expense",
        accountTypeName: "Expense",
        isSystemGenerated: true,
    },
    {
        accountName: "Postage",
        accountTypeName: "Expense",
        isSystemGenerated: true,
    },
    {
        accountName: "Bad Debt",
        accountTypeName: "Expense",
        isSystemGenerated: true,
    },
    {
        accountName: "Printing and Stationery",
        accountTypeName: "Expense",
        isSystemGenerated: true,
    },
    {
        accountName: "Salaries and Employee Wages",
        accountTypeName: "Expense",
        isSystemGenerated: true,
    },
    {
        accountName: "Meals and Entertainment",
        accountTypeName: "Expense",
        isSystemGenerated: true,
    },
    {
        accountName: "Depreciation Expense",
        accountTypeName: "Expense",
        isSystemGenerated: true,
    },
    {
        accountName: "Consultant Expense",
        accountTypeName: "Expense",
        isSystemGenerated: true,
    },
    {
        accountName: "Repairs and Maintenance",
        accountTypeName: "Expense",
        isSystemGenerated: true,
    },
    {
        accountName: "Other Expenses",
        accountTypeName: "Expense",
        isSystemGenerated: true,
    },
    {
        accountName: "Lodging",
        accountTypeName: "Expense",
        isSystemGenerated: true,
    },
    {
        accountName: "Uncategorized",
        accountTypeName: "Expense",
        isSystemGenerated: true,
    },
    {
        accountName: "Raw Materials And Consumables",
        accountTypeName: "Expense",
        isSystemGenerated: true,
    },
    {
        accountName: "Merchandise",
        accountTypeName: "Expense",
        isSystemGenerated: true,
    },
    {
        accountName: "Transportation Expense",
        accountTypeName: "Expense",
        isSystemGenerated: true,
    },
    {
        accountName: "Depreciation And Amortisation",
        accountTypeName: "Expense",
        isSystemGenerated: true,
    },
    {
        accountName: "Contract Assets",
        accountTypeName: "Expense",
        isSystemGenerated: true,
    },
    {
        accountName: "Office Supplies",
        accountTypeName: "Expense",
        isSystemGenerated: true,
    },
    {
        accountName: "Advertising And Marketing",
        accountTypeName: "Expense",
        isSystemGenerated: true,
    },
    {
        accountName: "Purchase Discounts",
        accountTypeName: "Expense",
        isSystemGenerated: true,
    },
    {
        accountName: "Bank Fees and Charges",
        accountTypeName: "Expense",
        isSystemGenerated: true,
    },
    {
        accountName: "Credit Card Charges",
        accountTypeName: "Expense",
        isSystemGenerated: true,
    },
    // ===== COST OF GOODS SOLD =====
    {
        accountName: "Cost of Goods Sold",
        accountTypeName: "Cost Of Goods Sold",
        isSystemGenerated: true,
    },
    {
        accountName: "Labor",
        accountTypeName: "Cost Of Goods Sold",
        isSystemGenerated: true,
    },
    {
        accountName: "Materials",
        accountTypeName: "Cost Of Goods Sold",
        isSystemGenerated: true,
    },
    {
        accountName: "Subcontractor",
        accountTypeName: "Cost Of Goods Sold",
        isSystemGenerated: true,
    },
    {
        accountName: "Job Costing",
        accountTypeName: "Cost Of Goods Sold",
        isSystemGenerated: true,
    },
    // ===== OTHER =====
    {
        accountName: "Exchange Gain or Loss",
        accountTypeName: "Other Expense",
        isSystemGenerated: true,
    },
    // ===== INVENTORY =====
    {
        accountName: "Inventory Asset",
        accountTypeName: "Stock",
        isSystemGenerated: true,
    },
];
