export enum BillingPaymentStatus {
  SALES = " sales",
  COST_OF_GOODS_SOLD = "cost of goods sold",
  CASH = "cash",
}

export enum PurchaseOrderDiscountType {
  PERCENTAGE = "%",
  FLAT = "flat",
}

export enum TaxPreferences {
  VAT = "VAT",
  NON_VAT = "Non-VAT",
}

export enum PaymentsMadeStatus {
  DRAFT = "draft",
  PAID = "paid",
  VOID = "void",
}

export enum PaymentsMode {
  CASH = "cash",
  CHEQUE = "cheque",
  UPI = "upi",
  CARD = "card",
  BANK_TRANSFER = "bank transfer",
}

export enum commonStatus {
  DRAFT = "Draft",
  SENT = "Sent",
  ACCEPETED = "Accepted",
  APPROVED = "Approved",
  INVOICED = "Invoiced",
  PENDING = "Pending",
  DECLINED = "Declined",
}
