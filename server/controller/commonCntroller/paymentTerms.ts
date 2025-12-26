import PAYMENT_TERMS from '../../models/paymentTerms';
import USER from '../../models/user'
import { Request, Response, NextFunction } from "express";
import BRANCH from "../../models/branch";
import mongoose from "mongoose";
import { Types } from "mongoose";
import { calculateDaysToEndOfMonth, calculateDaysToEndOfNextMonth } from '../../Helper/dateCalculation';
import PAYMENT_MODE from '../../models/paymentMode';



export const upsertPaymentTerms = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let { branchId, terms } = req.body;

    if (!branchId) {
      return res.status(400).json({ message: "branchId is required!" });
    }

    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      return res.status(400).json({ message: `Invalid branchId: ${branchId}` });
    }

    // 1) Check if paymentTerms already exists for this branch
    const existing = await PAYMENT_TERMS.findOne({ branchId });

    // 2) terms must be provided from frontend always in this flow
    if (!terms || !Array.isArray(terms) || terms.length === 0) {
      return res.status(400).json({ message: "terms is required!" });
    }

    // 3) Clean / normalize body terms
    const cleanedBodyTerms = terms.map((t: any) => ({
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
          days: calculateDaysToEndOfMonth(today),
        },
        {
          termName: "Due end of next month",
          days: calculateDaysToEndOfNextMonth(today),
        },
      ];

      // Combine defaults + body terms
      termsToSave = [...defaultTerms, ...cleanedBodyTerms];
    }

    const updatedDoc = await PAYMENT_TERMS.findOneAndUpdate(
      { branchId },
      {
        $set: {
          branchId,
          terms: termsToSave,
          createdById: existing?.createdById || userId, // keep original creator if exists
          deletedAt: null,
          deletedById: null,
          deletedBy: null,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json({
      message: existing
        ? "Payment terms updated successfully"
        : "Payment terms created successfully with defaults",
      data: [updatedDoc],
    });
  } catch (err) {
    next(err);
  }
};



export const getAllPaymentTerms = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { branchId } = req.params;

    if (!branchId || !mongoose.Types.ObjectId.isValid(branchId)) {
      return res.status(400).json({ message: "Valid branchId is required" });
    }

    const paymentTerms = await PAYMENT_TERMS.findOne({
      branchId,
    })
      // .populate("branchId", "name") // optional: adjust fields
      // .sort({ createdAt: -1 });     // latest first (optional)

    return res.status(200).json({
      data: paymentTerms,
    });
  } catch (err) {
         next(err);
  }
};


export const upsertPaymentModes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let { branchId, paymentModes } = req.body;

    if (!branchId) {
      return res.status(400).json({ message: "branchId is required!" });
    }

    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      return res.status(400).json({ message: `Invalid branchId: ${branchId}` });
    }

    // 1) Check if paymentTerms already exists for this branch
    const existing = await PAYMENT_MODE.findOne({ branchId });

    // 2) terms must be provided from frontend always in this flow
    if (!paymentModes || !Array.isArray(paymentModes) || paymentModes.length === 0) {
      return res.status(400).json({ message: "PaymentModes is required!" });
    }

    // 3) Clean / normalize body terms
    const cleanedBodyTerms = paymentModes.map((t: any) => ({
      paymentMode: t.paymentMode?.trim(),
    }));

    let termsToSave = cleanedBodyTerms;

    // 4) If this is the FIRST TIME (no existing doc), prepend default terms
    //    TODO Add this when adding branch for automatic creation 
    // if (!existing) {

    //   const defaultTerms = [
    //     {
    //       paymentMode: "Cash",
    //     },
    //    {
    //       paymentMode: "Bank Transfer",
    //     },
    //     {
    //       paymentMode: "Credit Card",
    //     },
    //      {
    //       paymentMode: "Wallet",
    //     },
    //      {
    //       paymentMode: "Cheque",
    //     }
    //   ];
      

    //   // Combine defaults + body terms
    //   termsToSave = [...defaultTerms, ...cleanedBodyTerms];
    // }

    const updatedDoc = await PAYMENT_MODE.findOneAndUpdate(
      { branchId },
      {
        $set: {
          branchId,
          paymentModes: termsToSave,
          createdById: existing?.createdById || userId, // keep original creator if exists
          deletedAt: null,
          deletedById: null,
          deletedBy: null,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json({
      message: existing
        ? "Payment modes updated successfully"
        : "Payment modes created successfully with defaults",
      data: [updatedDoc],
    });
  } catch (err) {
    next(err);
  }
};





export const getAllPaymenModes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { branchId } = req.params;

    if (!branchId || !mongoose.Types.ObjectId.isValid(branchId)) {
      return res.status(400).json({ message: "Valid branchId is required" });
    }

    const paymentTerms = await PAYMENT_MODE.findOne({
      branchId,
    })
      // .populate("branchId", "name") // optional: adjust fields
      // .sort({ createdAt: -1 });     // latest first (optional)

    return res.status(200).json({
      data: paymentTerms,
    });
  } catch (err) {
         next(err);
  }
};