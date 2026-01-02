"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commonStatus = exports.PaymentsMode = exports.PaymentsMadeStatus = exports.TaxPreferences = exports.PurchaseOrderDiscountType = exports.BillingPaymentStatus = void 0;
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
var PaymentsMadeStatus;
(function (PaymentsMadeStatus) {
    PaymentsMadeStatus["DRAFT"] = "draft";
    PaymentsMadeStatus["PAID"] = "paid";
    PaymentsMadeStatus["VOID"] = "void";
})(PaymentsMadeStatus || (exports.PaymentsMadeStatus = PaymentsMadeStatus = {}));
var PaymentsMode;
(function (PaymentsMode) {
    PaymentsMode["CASH"] = "cash";
    PaymentsMode["CHEQUE"] = "cheque";
    PaymentsMode["UPI"] = "upi";
    PaymentsMode["CARD"] = "card";
    PaymentsMode["BANK_TRANSFER"] = "bank transfer";
})(PaymentsMode || (exports.PaymentsMode = PaymentsMode = {}));
var commonStatus;
(function (commonStatus) {
    commonStatus["DRAFT"] = "Draft";
    commonStatus["SENT"] = "Sent";
    commonStatus["ACCEPETED"] = "Accepted";
    commonStatus["APPROVED"] = "Approved";
    commonStatus["INVOICED"] = "Invoiced";
    commonStatus["PENDING"] = "Pending";
    commonStatus["DECLINED"] = "Declined";
})(commonStatus || (exports.commonStatus = commonStatus = {}));
