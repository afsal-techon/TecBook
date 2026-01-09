"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountTypeModel = void 0;
const mongoose_1 = require("mongoose");
const enum_types_1 = require("../types/enum.types");
const accountTypesSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    code: {
        type: String,
        required: false,
        unique: true,
    },
    category: {
        type: String,
        enum: enum_types_1.accountTypesCategory,
    },
    description: {
        type: String,
        required: false,
    },
    isSystemGenerated: {
        type: Boolean,
        default: false,
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: false,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
exports.accountTypeModel = (0, mongoose_1.model)("AccountType", accountTypesSchema);
