"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const permissionSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    branchId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Branch" },
    permissions: [
        {
            module: { type: String, required: true },
            moduleFullAccess: { type: Boolean, default: false },
            actions: {
                can_create: { type: Boolean, default: false },
                can_read: { type: Boolean, default: false },
                can_update: { type: Boolean, default: false },
                can_delete: { type: Boolean, default: false },
            },
        },
    ],
    fullAdminAccess: { type: Boolean, default: false },
    User: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", default: null },
    createdBy: { type: String },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedById: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", default: null },
    deletedBy: { type: String, default: null },
}, { timestamps: true });
permissionSchema.index({ name: 1, branchId: 1 });
permissionSchema.index({ branchId: 1, isDeleted: 1 });
exports.default = mongoose_1.default.model("Permission", permissionSchema);
