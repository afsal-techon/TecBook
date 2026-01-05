"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PREFIX_MAP = exports.numberSettingsDocumentType = exports.commonStatus = exports.TaxPreferences = exports.PurchaseOrderDiscountType = exports.BillingPaymentStatus = void 0;
var BillingPaymentStatus;
(function (BillingPaymentStatus) {
    BillingPaymentStatus["SALES"] = " sales";
    BillingPaymentStatus["COST_OF_GOODS_SOLD"] = "cost of goods sold";
    BillingPaymentStatus["CASH"] = "cash";
})(BillingPaymentStatus || (exports.BillingPaymentStatus = BillingPaymentStatus = {}));
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
})(numberSettingsDocumentType || (exports.numberSettingsDocumentType = numberSettingsDocumentType = {}));
exports.PREFIX_MAP = {
    [numberSettingsDocumentType.QUOTE]: "QT-",
    [numberSettingsDocumentType.SALE_ORDER]: "SO-",
    [numberSettingsDocumentType.INVOICE]: "INV-",
    [numberSettingsDocumentType.PAYMENT]: "PAY-",
    [numberSettingsDocumentType.PURCHASE_ORDER]: "PO-",
    [numberSettingsDocumentType.BILL]: "BILL-",
    [numberSettingsDocumentType.EXPENSE]: "EXP-",
};
