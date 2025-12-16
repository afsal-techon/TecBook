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
const projectSchema = new mongoose_1.Schema({
    branchId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Branch",
        required: true,
    },
    customerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
    },
    projectName: {
        type: String,
        required: true,
        trim: true,
    },
    projectId: {
        type: String,
        trim: true,
        default: null,
    },
    billingMethod: {
        type: String,
        enum: [
            "Fixed Cost for Project",
            "Based on Project Hours",
            "Based on Task Hours",
            "Based on Staff Hours",
        ],
        required: true,
    },
    description: {
        type: String,
        default: null,
    },
    users: [
        {
            userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", default: null },
            email: { type: String, trim: true },
            ratePerHour: {
                type: Number,
                default: 0,
            },
        },
    ],
    projectCost: {
        type: Number,
        default: 0,
    },
    ratePerHour: {
        type: Number,
        default: 0,
    },
    tasks: [
        {
            _id: {
                type: mongoose_1.Schema.Types.ObjectId,
                auto: true,
            },
            taskName: { type: String, trim: true },
            description: { type: String, trim: true },
            ratePerHour: { type: Number, default: 0 }, // Only used in Task Hour method
            billable: { type: Boolean, default: true },
        },
    ],
    costBudget: {
        type: Number,
        default: 0,
    },
    revenueBudget: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: [
            "In progress",
            "Completed",
            "Not started",
            "Cancelled",
        ],
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    createdById: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    deletedAt: {
        type: Date,
        default: null,
    },
    deletedById: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    deletedBy: {
        type: String,
        default: null,
    },
}, { timestamps: true } //  automatically manages createdAt & updatedAt
);
projectSchema.index({ branchId: 1, isDeleted: 1, createdAt: -1 });
projectSchema.index({ customerId: 1, isDeleted: 1 });
projectSchema.index({ projectName: 1, branchId: 1 });
const projectModel = mongoose_1.default.model("Project", projectSchema);
exports.default = projectModel;
