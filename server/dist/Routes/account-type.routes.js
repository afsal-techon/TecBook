"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const checkPermission_1 = __importDefault(require("../middleware/checkPermission"));
const account_types_controller_1 = require("../controller/accountTypeController/account-types.controller");
const router = (0, express_1.Router)();
router.get("/", auth_1.verifyUser, (0, checkPermission_1.default)('admin', 'AccountType', 'can_read'), account_types_controller_1.accountTypeController.listAllAccountTypes);
exports.default = router;
