"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const checkPermission_1 = __importDefault(require("../middleware/checkPermission"));
const validate_dto_middleware_1 = require("../middleware/validate-dto.middleware");
const create_expense_dto_1 = require("../dto/create-expense.dto");
const expense_Controller_1 = require("../controller/expenseController/expense.Controller");
const imgUpload_1 = require("../middleware/imgUpload");
const router = (0, express_1.Router)();
router.post("/", auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'ExpenseModel', 'can_create'), imgUpload_1.upload.array('documents', 10), (0, validate_dto_middleware_1.validateDto)(create_expense_dto_1.CreateExpenseDto), expense_Controller_1.expenseController.createExpense);
router.put("/:id", auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'ExpenseModel', 'can_update'), imgUpload_1.upload.array('documents', 10), (0, validate_dto_middleware_1.validateDto)(create_expense_dto_1.UpdateExpenseDto), expense_Controller_1.expenseController.updateExpense);
router.get("/", auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'ExpenseModel', 'can_read'), expense_Controller_1.expenseController.getAllExpenses);
router.get("/:id", auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'ExpenseModel', 'can_read'), expense_Controller_1.expenseController.getExpenseById);
router.delete("/:id", auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'ExpenseModel', 'can_delete'), expense_Controller_1.expenseController.deleteExpenseById);
exports.default = router;
