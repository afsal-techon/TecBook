"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllPaymenModes = exports.upsertPaymentModes = exports.getAllPaymentTerms = exports.upsertPaymentTerms = void 0;
const paymentTerms_1 = __importDefault(require("../../models/paymentTerms"));
const mongoose_1 = __importDefault(require("mongoose"));
const dateCalculation_1 = require("../../Helper/dateCalculation");
const paymentMode_1 = __importDefault(require("../../models/paymentMode"));
const upsertPaymentTerms = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        let { branchId, terms } = req.body;
        if (!branchId) {
            return res.status(400).json({ message: "branchId is required!" });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(branchId)) {
            return res.status(400).json({ message: `Invalid branchId: ${branchId}` });
        }
        // 1) Check if paymentTerms already exists for this branch
        const existing = await paymentTerms_1.default.findOne({ branchId });
        // 2) terms must be provided from frontend always in this flow
        if (!terms || !Array.isArray(terms) || terms.length === 0) {
            return res.status(400).json({ message: "terms is required!" });
        }
        // 3) Clean / normalize body terms
        const cleanedBodyTerms = terms.map((t) => ({
            termName: t.termName?.trim(),
            days: typeof t.days === "number" ? t.days : 0,
        }));
        let termsToSave = cleanedBodyTerms;
        // 4) If this is the FIRST TIME (no existing doc), prepend default terms
        if (!existing) {
            const today = new Date();
            const defaultTerms = [
                {
                    termName: "Due on Receipt",
                    days: 0,
                },
                {
                    termName: "Due end of the month",
                    days: (0, dateCalculation_1.calculateDaysToEndOfMonth)(today),
                },
                {
                    termName: "Due end of next month",
                    days: (0, dateCalculation_1.calculateDaysToEndOfNextMonth)(today),
                },
            ];
            // Combine defaults + body terms
            termsToSave = [...defaultTerms, ...cleanedBodyTerms];
        }
        const updatedDoc = await paymentTerms_1.default.findOneAndUpdate({ branchId }, {
            $set: {
                branchId,
                terms: termsToSave,
                createdById: existing?.createdById || userId, // keep original creator if exists
                deletedAt: null,
                deletedById: null,
                deletedBy: null,
            },
        }, {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
        });
        return res.status(200).json({
            message: existing
                ? "Payment terms updated successfully"
                : "Payment terms created successfully with defaults",
            data: [updatedDoc],
        });
    }
    catch (err) {
        next(err);
    }
};
exports.upsertPaymentTerms = upsertPaymentTerms;
const getAllPaymentTerms = async (req, res, next) => {
    try {
        const { branchId } = req.params;
        if (!branchId || !mongoose_1.default.Types.ObjectId.isValid(branchId)) {
            return res.status(400).json({ message: "Valid branchId is required" });
        }
        const paymentTerms = await paymentTerms_1.default.findOne({
            branchId,
        });
        // .populate("branchId", "name") // optional: adjust fields
        // .sort({ createdAt: -1 });     // latest first (optional)
        return res.status(200).json({
            data: paymentTerms,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getAllPaymentTerms = getAllPaymentTerms;
const upsertPaymentModes = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { branchId, paymentModes } = req.body;
        // ------------------ Validations ------------------
        if (!branchId) {
            return res.status(400).json({ message: "branchId is required!" });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(branchId)) {
            return res.status(400).json({ message: `Invalid branchId: ${branchId}` });
        }
        if (!Array.isArray(paymentModes) || paymentModes.length === 0) {
            return res.status(400).json({ message: "paymentModes is required!" });
        }
        const paymentModeMap = new Map();
        for (const mode of paymentModes) {
            if (!mode?.paymentMode)
                continue;
            const trimmedName = mode.paymentMode.trim();
            const normalizedName = trimmedName.toLowerCase();
            // If same paymentMode appears again → it updates (overwrites)
            paymentModeMap.set(normalizedName, {
                paymentMode: trimmedName,
            });
        }
        const uniquePaymentModes = Array.from(paymentModeMap.values());
        if (uniquePaymentModes.length === 0) {
            return res.status(400).json({ message: "Valid payment modes required!" });
        }
        const existing = await paymentMode_1.default.findOne({ branchId });
        // ------------------ Upsert ------------------
        const updatedDoc = await paymentMode_1.default.findOneAndUpdate({ branchId }, {
            $set: {
                branchId,
                paymentModes: uniquePaymentModes,
                createdById: existing?.createdById || userId,
                deletedAt: null,
                deletedById: null,
                deletedBy: null,
            },
        }, {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
        });
        return res.status(200).json({
            message: existing
                ? "Payment modes updated successfully"
                : "Payment modes created successfully",
            data: [updatedDoc],
        });
    }
    catch (error) {
        next(error);
    }
};
exports.upsertPaymentModes = upsertPaymentModes;
const getAllPaymenModes = async (req, res, next) => {
    try {
        const { branchId } = req.params;
        if (!branchId || !mongoose_1.default.Types.ObjectId.isValid(branchId)) {
            return res.status(400).json({ message: "Valid branchId is required" });
        }
        const paymentTerms = await paymentMode_1.default.findOne({
            branchId,
        });
        // .populate("branchId", "name") // optional: adjust fields
        // .sort({ createdAt: -1 });     // latest first (optional)
        return res.status(200).json({
            data: paymentTerms,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getAllPaymenModes = getAllPaymenModes;
