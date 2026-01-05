"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseSchemaFields = void 0;
const mongoose_1 = require("mongoose");
// Common fields for ROOT schemas
exports.BaseSchemaFields = {
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
};
