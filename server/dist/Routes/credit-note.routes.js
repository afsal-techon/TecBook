"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const checkPermission_1 = __importDefault(require("../middleware/checkPermission"));
const validate_dto_middleware_1 = require("../middleware/validate-dto.middleware");
const imgUpload_1 = require("../middleware/imgUpload");
const credit_note_dto_1 = require("../dto/credit-note.dto");
const credit_note_controller_1 = require("../controller/creditNoterController/credit-note.controller");
const router = (0, express_1.Router)();
router.post("/", auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'CreditNote', 'can_create'), imgUpload_1.upload.array('documents', 10), (0, validate_dto_middleware_1.validateDto)(credit_note_dto_1.CreateCreditNoteDto), credit_note_controller_1.creditNoteController.createCreditNote);
router.put("/:id", auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'CreditNote', 'can_update'), imgUpload_1.upload.array('documents', 10), (0, validate_dto_middleware_1.validateDto)(credit_note_dto_1.UpdateCreditNoteDto), credit_note_controller_1.creditNoteController.updateCreditNoteById);
router.get("/", auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'CreditNote', 'can_read'), credit_note_controller_1.creditNoteController.getAllCreditNotes);
router.get("/:id", auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'CreditNote', 'can_read'), credit_note_controller_1.creditNoteController.getCreditNoteById);
router.delete("/:id", auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'CreditNote', 'can_delete'), credit_note_controller_1.creditNoteController.deleteCreditNote);
exports.default = router;
