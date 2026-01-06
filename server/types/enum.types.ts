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
  PAID = "Paid",
  BILLED = "Billed",
  CLOSED = "Closed",
  ISSUED = "Issued",
  OPEN = "Open",
}

export enum numberSettingsDocumentType {
  QUOTE = "QUOTE",
  SALE_ORDER = "SALE_ORDER",
  INVOICE = "INVOICE",
  PAYMENT = "PAYMENT",
  PURCHASE_ORDER = "PURCHASE_ORDER",
  BILL = "BILL",
  EXPENSE = "EXPENSE",
  CREDIT_NOTE = "CREDIT_NOTE",
}

export const PREFIX_MAP: Record<numberSettingsDocumentType, string> = {
  [numberSettingsDocumentType.QUOTE]: "QT-",
  [numberSettingsDocumentType.SALE_ORDER]: "SO-",
  [numberSettingsDocumentType.INVOICE]: "INV-",
  [numberSettingsDocumentType.PAYMENT]: "PAY-",
  [numberSettingsDocumentType.PURCHASE_ORDER]: "PO-",
  [numberSettingsDocumentType.BILL]: "BILL-",
  [numberSettingsDocumentType.EXPENSE]: "EXP-",
  [numberSettingsDocumentType.CREDIT_NOTE]: "CN-",
};

export enum PurchaseOrderStatus {
  DRAFT = "Draft",
  ISSUED = "Issued",
  CLOSED = "Closed",
  PENDING_APPROVAL = "Pending Approval",
  APPROVED = "Approved",
  BILLED = "Billed",
  PARTIALLY_BILLED = "Partially Billed",
  CANCELED = "Canceled",
  RECEIVED = "Received",
  YET_TO_BE_BILLED = "Yet to be Billed",
  YET_TO_BE_RECEIVED = "Yet to be Received",
}

export enum BillingRecordsStatus {
  DRAFT = "Draft",
  OPEN = "Open",
  PAID = "Paid",
  PARTIALLY_PAID = "Partially Paid",
}

export enum CreditNoteStatus {
  DRAFT = "Draft",
  OPEN = "Open",
  CLOSED = "Closed",
}
