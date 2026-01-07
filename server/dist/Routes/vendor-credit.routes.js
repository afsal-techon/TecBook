"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validate_dto_middleware_1 = require("../middleware/validate-dto.middleware");
const auth_1 = require("../middleware/auth");
const checkPermission_1 = __importDefault(require("../middleware/checkPermission"));
const imgUpload_1 = require("../middleware/imgUpload");
const vendor_credit_dto_1 = require("../dto/vendor-credit.dto");
const vendor_credit_controller_1 = require("../controller/vendorCreditController/vendor-credit.controller");
const router = (0, express_1.Router)();
router.post("/", auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'vendorCredit', 'can_create'), imgUpload_1.upload.array('documents', 10), (0, validate_dto_middleware_1.validateDto)(vendor_credit_dto_1.CreateVendorCreditDto), vendor_credit_controller_1.vendorCreditController.createVendorCredit);
router.put("/:id", auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'vendorCredit', 'can_update'), imgUpload_1.upload.array('documents', 10), (0, validate_dto_middleware_1.validateDto)(vendor_credit_dto_1.UpdateVendorCreditDto), vendor_credit_controller_1.vendorCreditController.updateVendorCredit);
router.get("/", auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'vendorCredit', 'can_read'), vendor_credit_controller_1.vendorCreditController.getAllVendorCredits);
router.get("/:id", auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'vendorCredit', 'can_read'), vendor_credit_controller_1.vendorCreditController.getVendorCreditById);
router.delete("/:id", auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'vendorCredit', 'can_delete'), vendor_credit_controller_1.vendorCreditController.deleteVendorCredit);
exports.default = router;
