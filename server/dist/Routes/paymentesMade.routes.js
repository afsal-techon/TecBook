"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const checkPermission_1 = __importDefault(require("../middleware/checkPermission"));
const validate_dto_middleware_1 = require("../middleware/validate-dto.middleware");
const paymentMade_dto_1 = require("../dto/paymentMade.dto");
const paymentMadeController_1 = require("../controller/paymentMadeController/paymentMadeController");
const imgUpload_1 = require("../middleware/imgUpload");
const router = (0, express_1.Router)();
router.post("/", auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'PaymentMade', 'can_create'), imgUpload_1.upload.array('documents', 10), (0, validate_dto_middleware_1.validateDto)(paymentMade_dto_1.CreatePaymentMadeDto), paymentMadeController_1.paymentMadeController.createPaymentMade);
router.put("/:id", auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'PaymentMade', 'can_update'), imgUpload_1.upload.array('documents', 10), (0, validate_dto_middleware_1.validateDto)(paymentMade_dto_1.UpdatePaymentMadeDto), paymentMadeController_1.paymentMadeController.updatePaymentMadeByID);
router.get("/", auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'PaymentMade', 'can_read'), paymentMadeController_1.paymentMadeController.getAllPaymentMadeData);
router.get("/:id", auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'PaymentMade', 'can_read'), paymentMadeController_1.paymentMadeController.getSinglePaymentMadeDataById);
router.delete("/:id", auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'PaymentMade', 'can_delete'), paymentMadeController_1.paymentMadeController.deletePaymentMadeById);
exports.default = router;
