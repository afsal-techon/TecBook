import BRANCH from "../models/branch";
import USER from "../models/user";
import express, { NextFunction, Request, Response } from "express";
import numberSettingModel from "../models/numberSetting";
import { Types } from "mongoose";
import { numberSettingsDocumentType, PREFIX_MAP } from "../types/enum.types";

// POST or PUT /api/quotes/settings
export const upsertDocumentNumberSetting = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const userId = req.user?.id;
    const {
      branchId,
      prefix,
      docType,
      nextNumber,
      mode,
    }: {
      branchId: string;
      prefix?: string;
      docType: numberSettingsDocumentType;
      nextNumber?: string;
      mode: string;
    } = req.body;

    //  Validate user
    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    if (!branchId) {
      return res.status(400).json({ message: "Branch ID is required!" });
    }

    if (!mode || (mode !== "Auto" && mode !== "Manual")) {
      return res
        .status(400)
        .json({ message: "Mode must be 'Auto' or 'Manual'" });
    }

    //  Common update object
    const updateData: any = {
      branchId: new Types.ObjectId(branchId),
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

      updateData.prefix = prefix?.trim() || PREFIX_MAP[docType];
      updateData.nextNumber = numeric;
      updateData.nextNumberRaw = clean;
    } else {
      // Manual
      updateData.prefix =
        prefix && prefix.trim() ? prefix.trim() : getDefaultPrefix(docType);
      updateData.nextNumber = null;
      // updateData.nextNumberRaw = "1";
    }

    const setting = await numberSettingModel.findOneAndUpdate(
      {
        branchId: new Types.ObjectId(branchId),
        docType,
      },
      updateData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      message: "Number setting saved successfully",
      data: setting,
    });
  } catch (err) {
    next(err);
  }
};

function getDefaultPrefix(docType: string) {
  switch (docType) {
    case "QUOTE":
      return "QT-";
    case "SALE_ORDER":
      return "SO-";
    case "INVOICE":
      return "INV-";
    case "PAYMENT":
      return "PAY-";
    case "PURCHASE_ORDER":
      return "PO-";
    case "BILL":
      return "BILL-";
    case "EXPENSE":
      return "EXP-";
    case "CREDIT_NOTE":
      return "CN-";
    case "VENDOR_CREDIT":
      return "VC-";  
    default:
      return "DOC-";
  }
}

export const getNextQuotePreview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const userId = req.user?.id;
    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) return res.status(400).json({ message: "User not found!" });

    const branchId = req.query.branchId as string;

    if (!branchId)
      return res.status(400).json({ message: "Branch ID is required!" });

    const docType = req.query.docType as string;

    const setting = await numberSettingModel.findOne({
      branchId: new Types.ObjectId(branchId),
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
  } catch (err) {
    next(err);
  }
};
