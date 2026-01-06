"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreditNoteStatus = exports.BillingRecordsStatus = exports.PurchaseOrderStatus = exports.PREFIX_MAP = exports.numberSettingsDocumentType = exports.commonStatus = exports.TaxPreferences = exports.PurchaseOrderDiscountType = void 0;
var PurchaseOrderDiscountType;
(function (PurchaseOrderDiscountType) {
    PurchaseOrderDiscountType["PERCENTAGE"] = "%";
    PurchaseOrderDiscountType["FLAT"] = "flat";
})(PurchaseOrderDiscountType || (exports.PurchaseOrderDiscountType = PurchaseOrderDiscountType = {}));
var TaxPreferences;
(function (TaxPreferences) {
    TaxPreferences["VAT"] = "VAT";
    TaxPreferences["NON_VAT"] = "Non-VAT";
})(TaxPreferences || (exports.TaxPreferences = TaxPreferences = {}));
var commonStatus;
(function (commonStatus) {
    commonStatus["DRAFT"] = "Draft";
    commonStatus["SENT"] = "Sent";
    commonStatus["ACCEPETED"] = "Accepted";
    commonStatus["APPROVED"] = "Approved";
    commonStatus["INVOICED"] = "Invoiced";
    commonStatus["PENDING"] = "Pending";
    commonStatus["DECLINED"] = "Declined";
    commonStatus["PAID"] = "Paid";
    commonStatus["BILLED"] = "Billed";
    commonStatus["CLOSED"] = "Closed";
    commonStatus["ISSUED"] = "Issued";
    commonStatus["OPEN"] = "Open";
})(commonStatus || (exports.commonStatus = commonStatus = {}));
var numberSettingsDocumentType;
(function (numberSettingsDocumentType) {
    numberSettingsDocumentType["QUOTE"] = "QUOTE";
    numberSettingsDocumentType["SALE_ORDER"] = "SALE_ORDER";
    numberSettingsDocumentType["INVOICE"] = "INVOICE";
    numberSettingsDocumentType["PAYMENT"] = "PAYMENT";
    numberSettingsDocumentType["PURCHASE_ORDER"] = "PURCHASE_ORDER";
    numberSettingsDocumentType["BILL"] = "BILL";
    numberSettingsDocumentType["EXPENSE"] = "EXPENSE";
    numberSettingsDocumentType["CREDIT_NOTE"] = "CREDIT_NOTE";
})(numberSettingsDocumentType || (exports.numberSettingsDocumentType = numberSettingsDocumentType = {}));
exports.PREFIX_MAP = {
    [numberSettingsDocumentType.QUOTE]: "QT-",
    [numberSettingsDocumentType.SALE_ORDER]: "SO-",
    [numberSettingsDocumentType.INVOICE]: "INV-",
    [numberSettingsDocumentType.PAYMENT]: "PAY-",
    [numberSettingsDocumentType.PURCHASE_ORDER]: "PO-",
    [numberSettingsDocumentType.BILL]: "BILL-",
    [numberSettingsDocumentType.EXPENSE]: "EXP-",
    [numberSettingsDocumentType.CREDIT_NOTE]: "CN-",
};
var PurchaseOrderStatus;
(function (PurchaseOrderStatus) {
    PurchaseOrderStatus["DRAFT"] = "Draft";
    PurchaseOrderStatus["ISSUED"] = "Issued";
    PurchaseOrderStatus["CLOSED"] = "Closed";
    PurchaseOrderStatus["PENDING_APPROVAL"] = "Pending Approval";
    PurchaseOrderStatus["APPROVED"] = "Approved";
    PurchaseOrderStatus["BILLED"] = "Billed";
    PurchaseOrderStatus["PARTIALLY_BILLED"] = "Partially Billed";
    PurchaseOrderStatus["CANCELED"] = "Canceled";
    PurchaseOrderStatus["RECEIVED"] = "Received";
    PurchaseOrderStatus["YET_TO_BE_BILLED"] = "Yet to be Billed";
    PurchaseOrderStatus["YET_TO_BE_RECEIVED"] = "Yet to be Received";
    PurchaseOrderStatus["UNRECEIVED"] = "Unreceived";
})(PurchaseOrderStatus || (exports.PurchaseOrderStatus = PurchaseOrderStatus = {}));
var BillingRecordsStatus;
(function (BillingRecordsStatus) {
    BillingRecordsStatus["DRAFT"] = "Draft";
    BillingRecordsStatus["OPEN"] = "Open";
    BillingRecordsStatus["PAID"] = "Paid";
    BillingRecordsStatus["PARTIALLY_PAID"] = "Partially Paid";
})(BillingRecordsStatus || (exports.BillingRecordsStatus = BillingRecordsStatus = {}));
var CreditNoteStatus;
(function (CreditNoteStatus) {
    CreditNoteStatus["DRAFT"] = "Draft";
    CreditNoteStatus["OPEN"] = "Open";
    CreditNoteStatus["CLOSED"] = "Closed";
})(CreditNoteStatus || (exports.CreditNoteStatus = CreditNoteStatus = {}));
