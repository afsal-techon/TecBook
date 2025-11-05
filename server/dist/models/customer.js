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
const customerSchema = new mongoose_1.Schema({
    branchId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Branch", default: null },
    name: { type: String, default: null },
    phone: { type: String, default: null },
    openingBalance: { type: Number, default: 0 },
    billingInfo: {
        country: { type: String, default: null },
        billingAddress: { type: String, default: null },
        city: { type: String, default: null },
        zipCode: { type: String, default: null }
    },
    shippingInfo: {
        country: { type: String, default: null },
        shippingAddress: { type: String, default: null },
        city: { type: String, default: null },
        zipCode: { type: String, default: null }
    },
    taxTreatment: { type: String, default: null },
    trn: { type: String, default: null },
    placeOfSupplay: { type: String, default: null },
    createdById: { type: String, default: null },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedById: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", default: null },
    deletedBy: { type: String, default: null },
}, {
    timestamps: true, // Automatically adds createdAt & updatedAt
});
customerSchema.index({ branchId: 1, name: 1 });
customerSchema.index({ branchId: 1, phone: 1 });
customerSchema.index({ branchId: 1, phone: 1, isDeleted: 1 });
const employeeModel = mongoose_1.default.model("Customer", customerSchema);
exports.default = employeeModel;
