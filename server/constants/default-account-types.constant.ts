import { accountTypesCategory } from "../types/enum.types";
import { IAccountType } from "../Interfaces/account-type.interface";

export const DEFAULT_ACCOUNT_TYPES: Partial<IAccountType>[] = [
  //assets
  {
    name: "Other Asset",
    category: accountTypesCategory.ASSET,
    isSystemGenerated: true,
  },
  {
    name: "Other Current Asset",
    category: accountTypesCategory.ASSET,
    isSystemGenerated: true,
  },
  {
    name: "Cash",
    category: accountTypesCategory.ASSET,
    isSystemGenerated: true,
  },
  {
    name: "Bank",
    category: accountTypesCategory.ASSET,
    isSystemGenerated: true,
  },
  {
    name: "Fixed Asset",
    category: accountTypesCategory.ASSET,
    isSystemGenerated: true,
  },
  {
    name: "Account Receivable",
    category: accountTypesCategory.ASSET,
    isSystemGenerated: true,
  },
  {
    name: "Stock",
    category: accountTypesCategory.ASSET,
    isSystemGenerated: true,
  },
  {
    name: "Payment Clearing Account",
    category: accountTypesCategory.ASSET,
    isSystemGenerated: true,
  },
  {
    name: "Intangible Asset",
    category: accountTypesCategory.ASSET,
    isSystemGenerated: true,
  },
  {
    name: "Non Current Asset",
    category: accountTypesCategory.ASSET,
    isSystemGenerated: true,
  },
  {
    name: "Deferred Tax Asset",
    category: accountTypesCategory.ASSET,
    isSystemGenerated: true,
  },

  //liability
  {
    name: "Other Current Liability",
    category: accountTypesCategory.LIABILITY,
    isSystemGenerated: true,
  },
  {
    name: "Credit Card",
    category: accountTypesCategory.LIABILITY,
    isSystemGenerated: true,
  },
  {
    name: "Non Current Liability",
    category: accountTypesCategory.LIABILITY,
    isSystemGenerated: true,
  },
  {
    name: "Other Liability",
    category: accountTypesCategory.LIABILITY,
    isSystemGenerated: true,
  },
  {
    name: "Accounts Payable",
    category: accountTypesCategory.LIABILITY,
    isSystemGenerated: true,
  },
  {
    name: "Overseas Tax Payable",
    category: accountTypesCategory.LIABILITY,
    isSystemGenerated: true,
  },
  {
    name: "Deferred Tax Liability",
    category: accountTypesCategory.LIABILITY,
    isSystemGenerated: true,
  },

  //equity
  {
    name: "Equity",
    category: accountTypesCategory.EQUITY,
    isSystemGenerated: true,
  },

  //income

  {
    name: "Income",
    category: accountTypesCategory.INCOME,
    isSystemGenerated: true,
  },
  {
    name: "Other Income",
    category: accountTypesCategory.INCOME,
    isSystemGenerated: true,
  },

  //expense
  {
    name: "Expense",
    category: accountTypesCategory.EXPENSE,
    isSystemGenerated: true,
  },
  {
    name: "Cost Of Goods Sold",
    category: accountTypesCategory.EXPENSE,
    isSystemGenerated: true,
  },
  {
    name: "Other Expense",
    category: accountTypesCategory.EXPENSE,
    isSystemGenerated: true,
  },
];
