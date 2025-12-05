"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNextQuotePreview = exports.upsertDocumentNumberSetting = void 0;
const user_1 = __importDefault(require("../models/user"));
const numberSetting_1 = __importDefault(require("../models/numberSetting"));
const mongoose_1 = require("mongoose");
// POST or PUT /api/quotes/settings
const upsertDocumentNumberSetting = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { branchId, prefix, docType, nextNumber, mode, } = req.body;
        //  Validate user
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        if (!branchId) {
            return res.status(400).json({ message: "Branch ID is required!" });
        }
        if (!mode || (mode !== "Auto" && mode !== "Manual")) {
            return res.status(400).json({ message: "Mode must be 'Auto' or 'Manual'" });
        }
        //  Common update object
        const updateData = {
            branchId: new mongoose_1.Types.ObjectId(branchId),
            docType,
            mode,
        };
        if (mode === "Auto") {
            if (!nextNumber || typeof nextNumber !== "string" || !nextNumber.trim()) {
                return res
                    .status(400)
                    .json({ message: "Next number is required in auto mode!" });
            }
            const clean = nextNumber.trim();
            const numeric = Number(clean);
            if (isNaN(numeric) || numeric < 1) {
                return res
                    .status(400)
                    .json({ message: "Next number must be a number >= 1" });
            }
            updateData.prefix = (prefix || getDefaultPrefix(docType)).trim();
            updateData.nextNumber = numeric;
            updateData.nextNumberRaw = clean;
        }
        else {
            // Manual
            updateData.prefix = prefix && prefix.trim()
                ? prefix.trim()
                : getDefaultPrefix(docType);
            updateData.nextNumber = null;
            // updateData.nextNumberRaw = "1";
        }
        const setting = await numberSetting_1.default.findOneAndUpdate({
            branchId: new mongoose_1.Types.ObjectId(branchId),
            docType,
        }, updateData, { upsert: true, new: true, setDefaultsOnInsert: true });
        return res.status(200).json({
            message: "Number setting saved successfully",
            data: setting,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.upsertDocumentNumberSetting = upsertDocumentNumberSetting;
function getDefaultPrefix(docType) {
    switch (docType) {
        case "QUOTE":
            return "QT-";
        case "SALE_ORDER":
            return "SO-";
        case "INVOICE":
            return "INV-";
        default:
            return "DOC-";
    }
}
const getNextQuotePreview = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user)
            return res.status(400).json({ message: "User not found!" });
        const branchId = req.query.branchId;
        if (!branchId)
            return res.status(400).json({ message: "Branch ID is required!" });
        const docType = req.query.docType;
        const setting = await numberSetting_1.default.findOne({
            branchId: new mongoose_1.Types.ObjectId(branchId),
            docType,
        });
        // If no setting yet – fallback default
        const defaultPrefix = getDefaultPrefix(docType);
        const prefix = setting?.prefix ?? defaultPrefix;
        // if setting.nextNumberRaw is "0001" → length = 4
        // if "1" → length = 1
        const raw = setting?.nextNumberRaw ?? "00001";
        const numeric = setting?.nextNumber ?? Number(raw) ?? 1;
        const length = raw.length;
        const paddedNumber = String(numeric).padStart(length, "0");
        const generatedId = `${prefix}${paddedNumber}`;
        return res.status(200).json({
            docType,
            generatedId, // e.g. "QT-0001" or "QT-1"
            prefix,
            nextNumber: numeric,
            nextNumberRaw: raw,
            mode: setting?.mode,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getNextQuotePreview = getNextQuotePreview;
