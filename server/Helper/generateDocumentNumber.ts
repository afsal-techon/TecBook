import { Types, Model } from "mongoose";
import numberSettingModel from "../models/numberSetting";

interface GenerateDocNumberParams {
  branchId: string;
  docType: "QUOTE" | "PURCHASE_ORDER" | "INVOICE";
  manualId?: string;
  Model: Model<any>;
  idField?: string;
}

export const generateDocumentNumber = async ({
  branchId,
  docType,
  manualId,
  Model,
  idField = "quoteId",
}: GenerateDocNumberParams): Promise<string> => {
  const setting = await numberSettingModel.findOne({
    branchId: new Types.ObjectId(branchId),
    docType,
  });

  let finalId: string;

  if (setting && setting.mode === "Auto") {
    // ---------- AUTO MODE ----------
    const raw = setting.nextNumberRaw ?? String(setting.nextNumber ?? 1);
    const numeric = setting.nextNumber ?? Number(raw) ?? 1;
    const length = raw.length;

    const padded = String(numeric).padStart(length, "0");
    finalId = `${setting.prefix}${padded}`;

    // uniqueness check
    const exists = await Model.findOne({
      branchId: new Types.ObjectId(branchId),
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
  } else {
    // ---------- MANUAL MODE ----------
    if (!manualId || typeof manualId !== "string" || !manualId.trim()) {
      throw new Error("Document ID is required in manual mode");
    }

    finalId = manualId.trim();

    const exists = await Model.findOne({
      branchId: new Types.ObjectId(branchId),
      [idField]: finalId,
      isDeleted: false,
    });

    if (exists) {
      throw new Error("This document ID already exists");
    }
  }

  return finalId;
};
