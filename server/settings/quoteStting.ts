import BRANCH from "../models/branch";
import USER from "../models/user";
import express, { NextFunction, Request, Response } from "express";
import quoteNumberModel from "../models/quoteNumberSetting";
import { Types } from "mongoose";

// POST or PUT /api/quotes/settings
export const upsertQuoteNumberSetting = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const userId = req.user?.id;
    const {
      branchId,
      prefix,
      nextNumber,
      mode,
    }: {
      branchId: string;
      prefix?: string;
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
      return res.status(400).json({ message: "Mode must be 'Auto' or 'Manual'" });
    }

    //  Common update object
    const updateData: any = {
      branchId: new Types.ObjectId(branchId),
      mode,
    };

    if (mode ==='Auto') {
      // AUTO MODE – must have prefix + nextNumber
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

      updateData.prefix = (prefix || "QT-").trim();
      updateData.nextNumber = numeric;
      updateData.nextNumberRaw = clean;
    } else {
      //  MANUAL MODE – ignore nextNumber/padding for generation
      //  still store a default prefix
      updateData.prefix = prefix && prefix.trim() ? prefix.trim() : "QT-";
      updateData.nextNumber = null; // not used
    }

    const setting = await quoteNumberModel.findOneAndUpdate(
      { branchId: new Types.ObjectId(branchId) },
      updateData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      message: "Quote number setting saved successfully",
      data: setting,
    });
  } catch (err) {
    next(err);
  }
};

export const getNextQuotePreview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const userId = req.user?.id;
    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) return res.status(400).json({ message: "User not found!" });

    const { branchId } = req.params;
    if (!branchId)
      return res.status(400).json({ message: "Branch ID is required!" });

    const setting = await quoteNumberModel.findOne({
      branchId: new Types.ObjectId(branchId),
    });

    // If no setting yet – fallback default
    const prefix = setting?.prefix ?? "QT-";
    // if setting.nextNumberRaw is "0001" → length = 4
    // if "1" → length = 1
    const raw = setting?.nextNumberRaw ?? "00001";
    const numeric = setting?.nextNumber ?? Number(raw) ?? 1;
    const length = raw.length;

    const paddedNumber = String(numeric).padStart(length, "0");
    const quoteId = `${prefix}${paddedNumber}`;

    return res.status(200).json({
      quoteId, // e.g. "QT-0001" or "QT-1"
      prefix,
      nextNumber: numeric,
      nextNumberRaw: raw,
      mode:setting?.mode,
    });
  } catch (err) {
    next(err);
  }
};
