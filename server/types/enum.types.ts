export enum PurchaseOrderDiscountType {
  PERCENTAGE = "%",
  FLAT = "flat",
}

export enum TaxPreferences {
  VAT = "VAT",
  NON_VAT = "Non-VAT",
}


export enum commonStatus {
  DRAFT = "Draft",
  SENT = "Sent",
  ACCEPETED = "Accepted",
  APPROVED = "Approved",
  INVOICED = "Invoiced",
  PENDING = "Pending",
  DECLINED = "Declined",
  PAID ='Paid',
  BILLED ='Billed',
  CLOSED ='Closed',
  ISSUED ='Issued',
}

export enum numberSettingsDocumentType {
  QUOTE = "QUOTE",
  SALE_ORDER = "SALE_ORDER",
  INVOICE = "INVOICE",
  PAYMENT = "PAYMENT",
  PURCHASE_ORDER = "PURCHASE_ORDER",
  BILL = "BILL",
  EXPENSE = "EXPENSE",
}

export const PREFIX_MAP: Record<numberSettingsDocumentType, string> = {
  [numberSettingsDocumentType.QUOTE]: "QT-",
  [numberSettingsDocumentType.SALE_ORDER]: "SO-",
  [numberSettingsDocumentType.INVOICE]: "INV-",
  [numberSettingsDocumentType.PAYMENT]: "PAY-",
  [numberSettingsDocumentType.PURCHASE_ORDER]: "PO-",
  [numberSettingsDocumentType.BILL]: "BILL-",
  [numberSettingsDocumentType.EXPENSE]: "EXP-",
};


export enum PurchaseOrderStatus {
  DRAFT = "Draft",
  ISSUED = "Issued",
  CLOSED = "Closed",
}

export enum BillingStatus {
  YET_TO_BE_BILLED = "Yet to be Billed",
  BILLED = "Billed",
  
}