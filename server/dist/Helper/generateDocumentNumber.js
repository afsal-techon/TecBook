"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDocumentNumber = generateDocumentNumber;
const mongoose_1 = require("mongoose");
const numberSetting_1 = __importDefault(require("../models/numberSetting"));
/**
 * Generates a unique document number for a given document type and branch.
 *
 * Supports two modes:
 * - **Auto mode**: Automatically generates the next sequential number based on configured settings
 * - **Manual mode**: Uses a manually provided document ID
 *
 * @param params - The parameters for document number generation
 * @param params.branchId - The ID of the branch
 * @param params.docType - The type of document (e.g., "quote", "invoice")
 * @param params.manualId - The manually provided document ID (required in manual mode)
 * @param params.Model - The Mongoose model to check for document uniqueness
 * @param params.idField - The field name to check for uniqueness (default: "quoteId")
 *
 * @returns A promise that resolves to the generated document number as a string
 *
 * @throws {Error} If the generated ID already exists in the database
 * @throws {Error} If manual mode is enabled but no valid manualId is provided
 *
 * @example
 * const docNumber = await generateDocumentNumber({
 *   branchId: "507f1f77bcf86cd799439011",
 *   docType: "quote",
 *   manualId: undefined,
 *   Model: QuoteModel,
 *   idField: "quoteId"
 * });
 */
async function generateDocumentNumber({ branchId, docType, manualId, Model, idField = "quoteId", }) {
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
}
