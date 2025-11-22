import USER from "../../models/user";
import QUOTATION from "../../models/quotation";
import express, { Request, Response, NextFunction } from "express";
import CUSTOMER from "../../models/customer";
import { imagekit } from "../../config/imageKit";
import { Types } from "mongoose";
import BRANCH from '../../models/branch'
import mongoose from "mongoose";
import QuoteNumberSetting from '../../models/quoteNumberSetting'

export const createQuotes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const {
      branchId,
      quoteId, // may be null/ignored in auto mode
      customerId,
      projectId,
      salesPersonId,
      quoteDate,
      expDate,
      status,
      item,
      subTotal,
      taxTotal,
      total,
      discount,
    } = req.body;

    const userId = req.user?.id;

    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    if (!branchId)
      return res.status(400).json({ message: "Branch ID is required!" });
    if (!customerId)
      return res.status(400).json({ message: "Customer ID is required!" });
    if (!quoteDate)
      return res.status(400).json({ message: "Quote Date is required!" });
    if (!status)
      return res.status(400).json({ message: "Status is required!" });

    const customer = await CUSTOMER.findOne({
      _id: customerId,
      isDeleted: false,
    });
    if (!customer) {
      return res.status(400).json({ message: "Customer not found!" });
    }

    if (!item || !Array.isArray(item) || item.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one item is required in the quotation" });
    }

    if (isNaN(subTotal)) return res.status(400).json({ message: "Invalid subTotal" });
    if (isNaN(total)) return res.status(400).json({ message: "Invalid total" });
    if (isNaN(taxTotal)) return res.status(400).json({ message: "Invalid taxTotal" });

    //  Get quote number setting for this branch
    let setting = await QuoteNumberSetting.findOne({
      branchId: new Types.ObjectId(branchId),
    });

    let finalQuoteId: string;

    if (setting && setting.mode === 'Auto') {
      // ---------- AUTO MODE ----------
       const raw = setting.nextNumberRaw ?? String(setting.nextNumber ?? 1);
        const numeric = setting.nextNumber ?? Number(raw) ?? 1;
        const length = raw.length;

           const padded = String(numeric).padStart(length, "0");
        finalQuoteId = `${setting.prefix}${padded}`;


      // optionally: ensure uniqueness
      const exists = await QUOTATION.findOne({
        branchId: new Types.ObjectId(branchId),
        quoteId: finalQuoteId,
        isDeleted: false,
      });
      if (exists) {
        return res.status(400).json({ message: "Generated quote ID already exists. Please try again." });
      }

      // increment for next time
      setting.nextNumber = numeric + 1;
  setting.nextNumberRaw = String(numeric + 1).padStart(length, "0");
  await setting.save();

    } else {
      // ---------- MANUAL MODE ----------
      if (!quoteId || typeof quoteId !== "string" || !quoteId.trim()) {
        return res
          .status(400)
          .json({ message: "Quote ID is required in manual mode!" });
      }

      finalQuoteId = quoteId.trim();

      // ensure unique
      const exists = await QUOTATION.findOne({
        branchId: new Types.ObjectId(branchId),
        quoteId: finalQuoteId,
        isDeleted: false,
      });
      if (exists) {
        return res.status(400).json({
          message: "This quote ID already exists. Please enter a different one.",
        });
      }
    }

    //  Upload attached documents if any
    const uploadedFiles: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const uploadResponse = await imagekit.upload({
          file: file.buffer.toString("base64"),
          fileName: file.originalname,
          folder: "/images",
        });
        uploadedFiles.push(uploadResponse.url);
      }
    }

    const newQuote = new QUOTATION({
      branchId: new Types.ObjectId(branchId),
      quoteId: finalQuoteId, //  always use this
      customerId: new Types.ObjectId(customerId),
      // projectId: projectId ? new Types.ObjectId(projectId) : null,
      projectId: projectId ? projectId : null,
      salesPersonId: salesPersonId ? new Types.ObjectId(salesPersonId) : null,
      quoteDate,
      expDate,
      status,
      item,
      subTotal,
      taxTotal,
      total,
      discount,
      documents: uploadedFiles,
      createdById: userId,
    });

    await newQuote.save();

    return res.status(201).json({
      message: `Quotation created successfully.`,
      quoteId: finalQuoteId,
    });
  } catch (err) {
    next(err);
  }
};




export const updateQuotes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const {
      quoteId,
      branchId,
      customerId,
      projectId,
      salesPersonId,
      quoteDate,
      expDate,
      status,
      item,
      subTotal,
      taxTotal,
      total,
      discount,
    } = req.body;

    const { quote_id } = req.params; // e.g. /api/quotes/:quote_id
    const userId = req.user?.id;

    // 1️Validate user
    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    // 2 Validate quote exists
    const existingQuote = await QUOTATION.findOne({
      _id: quote_id,
      isDeleted: false,
    });
    if (!existingQuote) {
      return res.status(404).json({ message: "Quotation not found!" });
    }

    // 3 Basic field checks
    if (!branchId)
      return res.status(400).json({ message: "Branch ID is required!" });
    if (!quoteId)
      return res.status(400).json({ message: "Quote ID is required!" });
    if (!customerId)
      return res.status(400).json({ message: "Customer ID is required!" });
    if (!quoteDate)
      return res.status(400).json({ message: "Quote Date is required!" });
    if (!status)
      return res.status(400).json({ message: "Status is required!" });

    // 4 Validate customer
    const customer = await CUSTOMER.findOne({
      _id: customerId,
      isDeleted: false,
    });
    if (!customer) {
      return res.status(400).json({ message: "Customer not found!" });
    }

    // 5 Validate items
    if (!item || !Array.isArray(item) || item.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one item is required in the quotation" });
    }

    // 6 Validate numeric fields
    if (isNaN(subTotal)) return res.status(400).json({ message: "Invalid subTotal" });
    if (isNaN(total)) return res.status(400).json({ message: "Invalid total" });
    if (isNaN(taxTotal)) return res.status(400).json({ message: "Invalid taxTotal" });

    // 7 Handle document uploads
    const uploadedFiles: string[] = [];

    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const uploadResponse = await imagekit.upload({
          file: file.buffer.toString("base64"),
          fileName: file.originalname,
          folder: "/images",
        });
        uploadedFiles.push(uploadResponse.url);
      }
    }

    // 8 Update the quotation
    existingQuote.branchId = new Types.ObjectId(branchId);
    existingQuote.quoteId = quoteId;
    existingQuote.customerId = new Types.ObjectId(customerId);
    // existingQuote.projectId = projectId ? new Types.ObjectId(projectId) : null;
    existingQuote.projectId = projectId ? projectId : null;
    existingQuote.salesPersonId = salesPersonId
      ? new Types.ObjectId(salesPersonId)
      : null;
    existingQuote.quoteDate = quoteDate;
    existingQuote.expDate = expDate;
    existingQuote.status = status;
    existingQuote.item = item;
    existingQuote.subTotal = subTotal;
    existingQuote.taxTotal = taxTotal;
    existingQuote.total = total;
    existingQuote.discount = discount;
    existingQuote.updatedAt = new Date();
   if (uploadedFiles.length > 0) {
  existingQuote.documents = uploadedFiles;
}

    await existingQuote.save();

    // 9️⃣ Optional email sending
    // if (status === "Sent" && customer.email) {
    //   await sendEmail({
    //     to: customer.email,
    //     subject: `Updated Quotation #${quoteId}`,
    //     html: `
    //       <h3>Dear ${customer.name || "Customer"},</h3>
    //       <p>Your quotation <b>#${quoteId}</b> has been updated.</p>
    //       <p>Total Amount: <b>${total}</b></p>
    //       <p>Status: <b>${status}</b></p>
    //     `,
    //   });
    // }

    return res.status(200).json({
      message: "Quotation updated successfully.",
    });
  } catch (err) {
    next(err);
  }
};


export const getAllQuotes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const userId = req.user?.id;

    // 🔹 Validate user
    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) return res.status(400).json({ message: "User not found!" });

    const userRole = user.role; // "CompanyAdmin" or "User"
    const filterBranchId = req.query.branchId as string;
    const search = ((req.query.search as string) || "").trim();

    // Date filters
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    // Pagination
    const limit = parseInt(req.query.limit as string) || 20;
    const page = parseInt(req.query.page as string) || 1;
    const skip = (page - 1) * limit;

    // 🔹 Determine allowed branches
    let allowedBranchIds: mongoose.Types.ObjectId[] = [];

    if (userRole === "CompanyAdmin") {
      const branches = await BRANCH.find({
        companyAdminId: userId,
        isDeleted: false,
      }).select("_id");
      allowedBranchIds = branches.map(
        (b) => new mongoose.Types.ObjectId(b._id as mongoose.Types.ObjectId)
      );
    } else if (userRole === "User") {
      if (!user.branchId) {
        return res
          .status(400)
          .json({ message: "User is not assigned to any branch!" });
      }
      allowedBranchIds = [user.branchId];
    } else {
      return res.status(403).json({ message: "Unauthorized role!" });
    }

    // 🔹 Apply branch filter if passed
    if (filterBranchId) {
      const filterId = new mongoose.Types.ObjectId(filterBranchId);
      if (!allowedBranchIds.some((id) => id.equals(filterId))) {
        return res.status(403).json({
          message: "You are not authorized to view quotations for this branch!",
        });
      }
      allowedBranchIds = [filterId];
    }

    // 🔹 Base match condition
    const matchStage: any = {
      branchId: { $in: allowedBranchIds },
      isDeleted: false,
    };

    // 🔹 Date filter (quoteDate)
    if (startDate && endDate) {
      matchStage.quoteDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      matchStage.quoteDate = { $gte: new Date(startDate) };
    } else if (endDate) {
      matchStage.quoteDate = { $lte: new Date(endDate) };
    }

    // 🔹 Pipeline
    const pipeline: any[] = [
      { $match: matchStage },

      // Join Customer
      {
        $lookup: {
          from: "customers",
          localField: "customerId",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },

      // Join Sales Person (user)
      {
        $lookup: {
          from: "users",
          localField: "salesPersonId",
          foreignField: "_id",
          as: "salesPerson",
        },
      },
      { $unwind: { path: "$salesPerson", preserveNullAndEmptyArrays: true } },
    ];

    // 🔹 Search
    if (search.length > 0) {
      pipeline.push({
        $match: {
          $or: [
            { quoteId: { $regex: search, $options: "i" } },
            { status: { $regex: search, $options: "i" } },
            { "customer.name": { $regex: search, $options: "i" } },
            { "customer.email": { $regex: search, $options: "i" } },
            { "salesPerson.firstName": { $regex: search, $options: "i" } },
            { "salesPerson.lastName": { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    // 🔹 Count total after filters
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await QUOTATION.aggregate(countPipeline);
    const totalCount = countResult[0]?.total || 0;

    // 🔹 Pagination + sorting
    pipeline.push({ $sort: { createdAt: -1 } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // 🔹 Project fields
    pipeline.push({
      $project: {
        quoteId: 1,
        branchId: 1,
        customerId: 1,
        projectId: 1,
        salesPersonId: 1,
        quoteDate: 1,
        expDate: 1,
        status: 1,
        subTotal: 1,
        taxTotal: 1,
        total: 1,
        discount: 1,
        documents: 1,
        createdAt: 1,
        "customer.name": 1,
        "customer.email": 1,
        "salesPerson.firstName": 1,
        "salesPerson.lastName": 1,
      },
    });

    // 🔹 Execute
    const quotes = await QUOTATION.aggregate(pipeline);

    return res.status(200).json({
      data: quotes,
      totalCount,
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
};


