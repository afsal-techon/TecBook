import USER from "../../models/user";
import QUOTATION from "../../models/quotation";
import express, { Request, Response, NextFunction } from "express";
import CUSTOMER from "../../models/customer";
import { imagekit } from "../../config/imageKit";
import { Types } from "mongoose";
import BRANCH from "../../models/branch";
import mongoose from "mongoose";
import QuoteNumberSetting from "../../models/numberSetting";
import SALSE_PERSON from "../../models/salesPerson";
import TAX from "../../models/tax";
import PROJECT from "../../models/project";

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
      items,
      terms,
      note,
      subTotal,
      taxTotal,
      reference,
      total,
      discountValue,
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

    if (salesPersonId) {
      const salesPerson = await SALSE_PERSON.findById(salesPersonId);
      if (!salesPerson) {
        return res.status(400).json({ message: "Sales person not found!" });
      }
    }

    let parsedItems: any[] = [];

    if (items) {
      if (typeof items === "string") {
        parsedItems = JSON.parse(items); // <-- main step
      } else {
        parsedItems = items; // in case it's already object/array
      }
    }

    if (
      !parsedItems ||
      !Array.isArray(parsedItems) ||
      parsedItems.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "At least one item is required in the quotation" });
    }

    if (isNaN(Number(subTotal)))
      return res.status(400).json({ message: "Invalid subTotal" });
    if (isNaN(Number(total)))
      return res.status(400).json({ message: "Invalid total" });
    if (isNaN(Number(taxTotal)))
      return res.status(400).json({ message: "Invalid taxTotal" });

    //  Get quote number setting for this branch
    let setting = await QuoteNumberSetting.findOne({
      branchId: new Types.ObjectId(branchId),
      docType: "QUOTE",
    });

    let finalQuoteId: string;

    if (setting && setting.mode === "Auto") {
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
        return res.status(400).json({
          message: "Generated quote ID already exists. Please try again.",
        });
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
          message:
            "This quote ID already exists. Please enter a different one.",
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

    for (let item of parsedItems) {
      if (
        !item.itemName ||
        !item.qty ||
        !item.rate ||
        !item.amount ||
        !item.unit
      ) {
        return res.status(400).json({ message: "Invalid item data!" });
      }

      let taxAmount = 0;

      // TAX CALCULATION (Backend Controlled)
      if (item.taxId) {
        const taxDoc = await TAX.findOne({
          _id: item.taxId,
          isDeleted: false,
          isActive: true,
        });

        if (!taxDoc) {
          return res.status(400).json({
            message: `Invalid tax selected for item ${item.itemName}`,
          });
        }
        const taxableAmount = Number(item.rate) * Number(item.qty || 1);

        if (taxDoc.type === "VAT") {
          taxAmount = (taxableAmount * (taxDoc.vatRate || 0)) / 100;
        }

        if (taxDoc.type === "GST") {
          const totalGstRate = (taxDoc.cgstRate || 0) + (taxDoc.sgstRate || 0);
          taxAmount = (taxableAmount * totalGstRate) / 100;
        }
      }

      //  Apply discount per item if exists
      // let itemDiscount = item.discount || 0;
      // let finalItemAmount = itemAmount - itemDiscount;

      item.tax = Number(taxAmount.toFixed(2));
    }

    if (projectId) {
      const project = await PROJECT.findById(projectId);
      if (!project) {
        return res.status(400).json({ message: "Project not found!" });
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
      items: parsedItems,
      subTotal,
      taxTotal,
      total,
      discount: discountValue,
      documents: uploadedFiles,
      terms,
      reference,
      note,
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
    const { quoteId } = req.params;

    const {
      // ID of the quote document in DB (or _id) – adjust naming if needed
      branchId,
      customerId,
      projectId,
      salesPersonId,
      quoteDate,
      expDate,
      status,
      items,
      subTotal,
      terms,
      reference,
      note,
      taxTotal,
      total,
      discountValue,
      existingDocuments, // from frontend: existing docs (JSON string or array)
    } = req.body;

    const userId = req.user?.id;

    console.log("datadi", status);

    //  Validate user
    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    //   quote identifier provided (assuming `quoteId` is Mongo _id here)
    if (!quoteId) {
      return res.status(400).json({ message: "Quote ID is required!" });
    }

    //  Find existing quote
    const quote = await QUOTATION.findOne({
      _id: quoteId,
      isDeleted: false,
    });

    if (!quote) {
      return res.status(400).json({ message: "Quotation not found!" });
    }

    //  Basic validations
    if (!branchId)
      return res.status(400).json({ message: "Branch ID is required!" });
    if (!customerId)
      return res.status(400).json({ message: "Customer ID is required!" });
    if (!quoteDate)
      return res.status(400).json({ message: "Quote Date is required!" });
    if (!status)
      return res.status(400).json({ message: "Status is required!" });

    //  Validate customer
    const customer = await CUSTOMER.findOne({
      _id: customerId,
      isDeleted: false,
    });
    if (!customer) {
      return res.status(400).json({ message: "Customer not found!" });
    }

    //  Parse items (from FormData string or array)
    let parsedItems: any[] = [];

    if (items) {
      if (typeof items === "string") {
        parsedItems = JSON.parse(items);
      } else {
        parsedItems = items;
      }
    }

    if (
      !parsedItems ||
      !Array.isArray(parsedItems) ||
      parsedItems.length === 0
    ) {
      return res.status(400).json({
        message: "At least one item is required in the quotation",
      });
    }

    if (isNaN(subTotal)) {
      return res.status(400).json({ message: "Invalid subTotal" });
    }
    if (isNaN(total)) {
      return res.status(400).json({ message: "Invalid total" });
    }
    if (isNaN(taxTotal)) {
      return res.status(400).json({ message: "Invalid taxTotal" });
    }

    //  Handle existingDocuments (similar pattern to updateEmployee)
    // Frontend sends existingDocuments as JSON string or array
    let finalDocuments: string[] = [];

    if (existingDocuments) {
      const parsedExistingDocs = Array.isArray(existingDocuments)
        ? existingDocuments
        : JSON.parse(existingDocuments);

      // Support both string array and array of objects with doc_file
      finalDocuments = parsedExistingDocs
        .map((doc: any) => {
          if (typeof doc === "string") {
            return doc;
          }
          // if object: { doc_file: 'url', ... }
          return doc.doc_file || "";
        })
        .filter((url: string) => !!url);
    }

    //  Handle new file uploads (same as createQuotes)
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const uploadResponse = await imagekit.upload({
          file: file.buffer.toString("base64"),
          fileName: file.originalname,
          folder: "/images",
        });
        finalDocuments.push(uploadResponse.url);
      }
    }

    for (let item of parsedItems) {
      if (
        !item.itemName ||
        !item.qty ||
        !item.rate ||
        !item.amount ||
        !item.unit
      ) {
        return res.status(400).json({ message: "Invalid item data!" });
      }

      let taxAmount = 0;

      // TAX CALCULATION (Backend Controlled)
      if (item.taxId) {
        const taxDoc = await TAX.findOne({
          _id: item.taxId,
          isDeleted: false,
          isActive: true,
        });

        if (!taxDoc) {
          return res.status(400).json({
            message: `Invalid tax selected for item ${item.itemName}`,
          });
        }
        const taxableAmount = Number(item.rate) * Number(item.qty || 1);

        if (taxDoc.type === "VAT") {
          taxAmount = (taxableAmount * (taxDoc.vatRate || 0)) / 100;
        }

        if (taxDoc.type === "GST") {
          const totalGstRate = (taxDoc.cgstRate || 0) + (taxDoc.sgstRate || 0);
          taxAmount = (taxableAmount * totalGstRate) / 100;
        }
      }

      item.tax = Number(taxAmount.toFixed(2));
    }
    if (projectId) {
      const project = await PROJECT.findById(projectId);
      if (!project) {
        return res.status(400).json({ message: "Project not found!" });
      }
    }

    //  Update quote fields (do NOT change auto-generated quoteId)
    quote.branchId = new Types.ObjectId(branchId);
    quote.customerId = new Types.ObjectId(customerId);
    quote.projectId = projectId ? projectId : null;
    quote.salesPersonId = salesPersonId
      ? new Types.ObjectId(salesPersonId)
      : null;
    quote.quoteDate = quoteDate;
    quote.expDate = expDate;
    quote.status = status;
    quote.items = parsedItems;
    quote.subTotal = subTotal;
    quote.taxTotal = taxTotal;
    quote.total = total;
    quote.reference = reference;
    quote.discount = discountValue;
    quote.documents = finalDocuments;
    quote.terms = terms;
    quote.note = note;
    // quote.updatedById = userId; // if you track updatedBy

    await quote.save();

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

    const statusFilter = (req.query.status as string) || "";

    const allowedStatuses = [
      "Draft",
      "Accepted",
      "Approved",
      "Sent",
      "Invoiced",
      "Pending",
      "Declined",
    ];

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

    if (statusFilter && allowedStatuses.includes(statusFilter)) {
      matchStage.status = statusFilter;
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
          from: "salespeople",
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
            { "customer.name": { $regex: search, $options: "i" } },
            // { "customer.email": { $regex: search, $options: "i" } },
            // { "salesPerson.name": { $regex: search, $options: "i" } },
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
        reference: 1,
        total: 1,
        discount: 1,
        documents: 1,
        createdAt: 1,
        "customer.name": 1,
        "customer.email": 1,
        "salesPerson.name": 1,
        "salesPerson.email": 1,
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

export const getOneQuotation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const userId = req.user?.id;
    const { quoteId } = req.params; // assuming /quotes/:id

    // 1) Validate ID
    if (!quoteId || !Types.ObjectId.isValid(quoteId)) {
      return res.status(400).json({ message: "Invalid quotation ID!" });
    }
    const quoteObjectId = new Types.ObjectId(quoteId);

    // 2) Validate user
    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    const pipeline: any[] = [
      {
        $match: {
          _id: quoteObjectId,
          // branchId: { $in: allowedBranchIds },
          isDeleted: false,
        },
      },

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
          from: "salespeople",
          localField: "salesPersonId",
          foreignField: "_id",
          as: "salesPerson",
        },
      },
      {
        $lookup: {
          from: "items",
          localField: "items.itemId",
          foreignField: "_id",
          as: "itemDetails",
        },
      },
      { $unwind: { path: "$salesPerson", preserveNullAndEmptyArrays: true } },

      // (Optional) Join Project
      {
        $lookup: {
          from: "projects", // change to your actual collection name
          localField: "projectId",
          foreignField: "_id",
          as: "project",
        },
      },
      { $unwind: { path: "$project", preserveNullAndEmptyArrays: true } },

      {
        $project: {
          _id: 1,
          branchId: 1,
          quoteId: 1,
          customerId: 1,
          projectId: 1,
          salesPersonId: 1,
          quoteDate: 1,
          expDate: 1,
          status: 1,
          subTotal: 1,
          taxTotal: 1,
          reference: 1,
          total: 1,
          discount: 1,
          documents: 1,
          note: 1,
          terms: 1, // full items array as saved
          createdAt: 1,
          updatedAt: 1,
          items: {
            $map: {
              input: "$items",
              as: "it",
              in: {
                itemId: "$$it.itemId",
                taxId: "$$it.taxId",
                itemName: "$$it.itemName", // <-- DIRECTLY FROM SAVED DATA
                qty: "$$it.qty",
                tax: "$$it.tax",
                rate: "$$it.rate",
                amount: "$$it.amount",
                unit: "$$it.unit",
                discount: "$$it.discount",
              },
            },
          },

          // customer fields
          customer: {
            _id: "$customer._id",
            name: "$customer.name",
            phone: "$customer.phone",
            email: "$customer.email",
            billingInfo: "$customer.billingInfo",
            shippingInfo: "$customer.shippingInfo",
            taxTreatment: "$customer.taxTreatment",
            trn: "$customer.trn",
          },

          // sales person fields
          salesPerson: {
            _id: "$salesPerson._id",
            name: "$salesPerson.name",
            email: "$salesPerson.email",
          },

          // project fields (if you need)
          project: {
            _id: "$project._id",
            name: "$project.name",
            // add more project fields as needed
          },

          // If you joined branch
          // branch: {
          //   _id: "$branch._id",
          //   name: "$branch.name",
          // },
        },
      },
    ];

    const result = await QUOTATION.aggregate(pipeline);

    if (!result || result.length === 0) {
      return res.status(404).json({ message: "Quotation not found!" });
    }

    // Since we matched by _id, there will be exactly one
    return res.status(200).json({
      data: result[0],
    });
  } catch (err) {
    next(err);
  }
};

export const deleteQuotation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { quoteId } = req.params;

    const userId = req.user?.id;

    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    if (!quoteId) {
      return res.status(400).json({ message: "Quotation Id is required!" });
    }

    const quotation = await QUOTATION.findOne({ _id: quoteId });
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found!" });
    }

    // const itemExist = await ITEMS.findOne({
    //   quoteId: quoteId,
    //   isDeleted: false,
    // });

    // if (itemExist) {
    //   return res.status(400).json({
    //     message:
    //       "This category currently linked to Items. Please remove Items before deleting.",
    //   });
    // }

    await QUOTATION.findByIdAndUpdate(quoteId, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedById: user._id,
      deletedBy: user.username,
    });

    return res.status(200).json({
      message: "Quotation deleted successfully!",
    });
  } catch (err) {
    next(err);
  }
};

export const markAcceptOrReject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    let { status, quoteId } = req.body;

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    if (!quoteId) {
      return res.status(400).json({ message: "Quotation Id is required!" });
    }

    const quotation = await QUOTATION.findOne({ _id: quoteId });
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found!" });
    }

    if (!status) {
      return res.status(400).json({ message: "Status is required!" });
    }

    // normalize / validate status
    status = String(status);
    if (status !== "Accepted" && status !== "Declined" && status !== "Sent") {
      return res
        .status(400)
        .json({ message: "Status must be either 'Accepted' or 'Declined'" });
    }

    quotation.status = status;
    await quotation.save(); // <-- important

    return res.status(200).json({
      message:
        status === "Accepted"
          ? "Quotation marked as Accepted"
          : status === "Declined"
          ? "Quotation marked as Declined"
          : "Quotation marked as Sent",
    });
  } catch (err) {
    next(err);
  }
};
