"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDocumentNumber = void 0;
const mongoose_1 = require("mongoose");
const numberSetting_1 = __importDefault(require("../models/numberSetting"));
const generateDocumentNumber = async ({ branchId, docType, manualId, Model, idField = "quoteId", }) => {
    const setting = await numberSetting_1.default.findOne({
        branchId: new mongoose_1.Types.ObjectId(branchId),
        docType,
    });
    let finalId;
    if (setting && setting.mode === "Auto") {
        // ---------- AUTO MODE ----------
        const raw = setting.nextNumberRaw ?? String(setting.nextNumber ?? 1);
        const numeric = setting.nextNumber ?? Number(raw) ?? 1;
        const length = raw.length;
        const padded = String(numeric).padStart(length, "0");
        finalId = `${setting.prefix}${padded}`;
        // uniqueness check
        const exists = await Model.findOne({
            branchId: new mongoose_1.Types.ObjectId(branchId),
            [idField]: finalId,
            isDeleted: false,
        });
        if (exists) {
            throw new Error("Generated document ID already exists");
        }
        // increment
        setting.nextNumber = numeric + 1;
        setting.nextNumberRaw = String(numeric + 1).padStart(length, "0");
        await setting.save();
    }
    else {
        // ---------- MANUAL MODE ----------
        if (!manualId || typeof manualId !== "string" || !manualId.trim()) {
            throw new Error("Document ID is required in manual mode");
        }
        finalId = manualId.trim();
        const exists = await Model.findOne({
            branchId: new mongoose_1.Types.ObjectId(branchId),
            [idField]: finalId,
            isDeleted: false,
        });
        if (exists) {
            throw new Error("This document ID already exists");
        }
    }
    return finalId;
};
exports.generateDocumentNumber = generateDocumentNumber;
