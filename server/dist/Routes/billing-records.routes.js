"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const checkPermission_1 = __importDefault(require("../middleware/checkPermission"));
const validate_dto_middleware_1 = require("../middleware/validate-dto.middleware");
const billing_records_dto_1 = require("../dto/billing-records.dto");
const billing_records_controller_1 = __importDefault(require("../controller/billingController/billing-records.controller"));
const router = (0, express_1.Router)();
router.post("/", auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'PurchaseOrder', 'can_create'), (0, validate_dto_middleware_1.validateDto)(billing_records_dto_1.CreateBillingRecordsDTO), billing_records_controller_1.default.createBillingRecords);
router.put("/:id", auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'PurchaseOrder', 'can_update'), (0, validate_dto_middleware_1.validateDto)(billing_records_dto_1.updateBillingRecordsDTO), billing_records_controller_1.default.updateBillingRecords);
router.get("/", auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'PurchaseOrder', 'can_read'), billing_records_controller_1.default.getAllBillingRecords);
router.get("/:id", auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'PurchaseOrder', 'can_read'), billing_records_controller_1.default.getBillingRecordById);
router.delete("/:id", auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'PurchaseOrder', 'can_delete'), billing_records_controller_1.default.genericDeleteOneById);
exports.default = router;
