import SALES_ORDER from "../../models/saleOrder";
import USER from "../../models/user";
import express, { Request, Response, NextFunction } from "express";
import CUSTOMER from "../../models/customer";
import { imagekit } from "../../config/imageKit";
import { Types } from "mongoose";
import BRANCH from "../../models/branch";
import mongoose from "mongoose";
import saleNumberSetting from "../../models/numberSetting";
import PAYMENT_TEMRS from "../../models/paymentTerms";
import SALSE_PERSON from '../../models/salesPerson'
import TAX from '../../models/tax'
import { escapeRegex } from "../../Helper/searchHelper";

export const createSaleOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const {
      branchId,
      saleOrderId, // may be null/ignored in auto mode
      customerId,
      salesPersonId,
      saleOrderDate,
      deliveryDate,
      status,
      reference,
      items,
      paymentTerms,
      terms,
      note,
      subTotal,
      taxTotal,
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
    if (!saleOrderDate)
      return res.status(400).json({ message: "Sale order Date is required!" });
    if (!deliveryDate)
      return res.status(400).json({ message: "Delivery Date is required!" });
    if (!status)
      return res.status(400).json({ message: "Status is required!" });

    const customer = await CUSTOMER.findOne({
      _id: customerId,
      isDeleted: false,
    });
    if (!customer) {
      return res.status(400).json({ message: "Customer not found!" });
    }

    
    if(salesPersonId){
      const salesPerson = await SALSE_PERSON.findById(salesPersonId);
      if(!salesPerson){
        return res.status(400).json({ message:'Sales person not found!'})
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

    let parsedTerms: any[] = [];

    if (paymentTerms) {
      if (typeof items === "string") {
        parsedTerms = JSON.parse(paymentTerms); // <-- main step
      } else {
        parsedTerms = paymentTerms; // in case it's already object/array
      }
    }

    if (
      !parsedItems ||
      !Array.isArray(parsedItems) ||
      parsedItems.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "At least one payment term is required!" });
    }

    if (isNaN(subTotal))
      return res.status(400).json({ message: "Invalid subTotal" });
    if (isNaN(total)) return res.status(400).json({ message: "Invalid total" });
    if (isNaN(taxTotal))
      return res.status(400).json({ message: "Invalid taxTotal" });

    //  Get quote number setting for this branch
    let setting = await saleNumberSetting.findOne({
      branchId: new Types.ObjectId(branchId),
      docType: "SALE_ORDER",
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
      const exists = await SALES_ORDER.findOne({
        branchId: new Types.ObjectId(branchId),
        saleOrderId: finalQuoteId,
        isDeleted: false,
      });
      if (exists) {
        return res.status(400).json({
          message: "Generated sale Id already exists. Please try again.",
        });
      }

      // increment for next time
      setting.nextNumber = numeric + 1;
      setting.nextNumberRaw = String(numeric + 1).padStart(length, "0");
      await setting.save();
    } else {
      // ---------- MANUAL MODE ----------
      if (
        !saleOrderId ||
        typeof saleOrderId !== "string" ||
        !saleOrderId.trim()
      ) {
        return res
          .status(400)
          .json({ message: "Sale order Id is required in manual mode!" });
      }

      finalQuoteId = saleOrderId.trim();

      // ensure unique
      const exists = await SALES_ORDER.findOne({
        branchId: new Types.ObjectId(branchId),
        saleOrderId: finalQuoteId,
        isDeleted: false,
      });
      if (exists) {
        return res.status(400).json({
          message: "This Sale Id already exists. Please enter a different one.",
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
      if (!item.itemName || !item.qty || !item.rate || !item.amount || !item.unit) {
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

    const saleOrder = new SALES_ORDER({
      branchId: new Types.ObjectId(branchId),
      saleOrderId: finalQuoteId, //  always use this
      customerId: new Types.ObjectId(customerId),
      // projectId: projectId ? new Types.ObjectId(projectId) : null,
      salesPersonId: salesPersonId ? new Types.ObjectId(salesPersonId) : null,
      saleOrderDate,
      deliveryDate,
      status,
      items: parsedItems,
      paymentTerms: parsedTerms,
      terms,
      reference,
      subTotal,
      taxTotal,
      total,
      discount: discountValue,
      documents: uploadedFiles,
      note,
      createdById: userId,
    });

    await saleOrder.save();

    return res.status(201).json({
      message: `Sale order created successfully.`,
      saleOrderId: finalQuoteId,
    });
  } catch (err) {
    next(err);
  }
};

export const updateSaleOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { saleOrderId } = req.params;

    const {
      branchId,
      customerId,
      salesPersonId,
      deliveryDate,
      saleOrderDate,
      status,
      items,
      subTotal,
      terms,
      paymentTerms,
      reference,
      note,
      taxTotal,
      total,
      discountValue,
      existingDocuments,
    } = req.body;

    const userId = req.user?.id;

    // Validate user
    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) return res.status(400).json({ message: "User not found!" });

    // Validate saleOrderId
    if (!saleOrderId)
      return res.status(400).json({ message: "Sale Id is required!" });

    const saleOrder = await SALES_ORDER.findOne({
      _id: saleOrderId,
      isDeleted: false,
    });

    if (!saleOrder)
      return res.status(400).json({ message: "Sale order not found!" });

    // Required fields
    if (!branchId)
      return res.status(400).json({ message: "Branch ID is required!" });
    if (!customerId)
      return res.status(400).json({ message: "Customer ID is required!" });
    if (!saleOrderDate)
      return res.status(400).json({ message: "Sale order date is required!" });
    if (!deliveryDate)
      return res.status(400).json({ message: "Delivery date is required!" });
    if (!status)
      return res.status(400).json({ message: "Status is required!" });

    // Validate customer
    const customer = await CUSTOMER.findOne({
      _id: customerId,
      isDeleted: false,
    });
    if (!customer)
      return res.status(400).json({ message: "Customer not found!" });

    // -----------------------------
    // Parse ITEMS
    // -----------------------------
    let parsedItems: any[] = [];

    if (items) {
      parsedItems = typeof items === "string" ? JSON.parse(items) : items;
    }

    if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
      return res.status(400).json({
        message: "At least one item is required!",
      });
    }

    // -----------------------------
    // Parse TERMS (payment term object - REQUIRED)
    // -----------------------------
    interface ITerm {
      _id: string | null;
      termName: string | null;
      days: number;
    }

    if (!paymentTerms) {
      return res.status(400).json({ message: "Payment term  is required!" });
    }

    const rawTerms =
      typeof paymentTerms === "string"
        ? JSON.parse(paymentTerms)
        : paymentTerms;

    if (!rawTerms || typeof rawTerms !== "object") {
      return res.status(400).json({ message: "Invalid payment term format!" });
    }

    if (!rawTerms._id) {
      return res.status(400).json({ message: "payment term Id is required!" });
    }

    if (!rawTerms.termName || !String(rawTerms.termName).trim()) {
      return res.status(400).json({ message: "Term name is required!" });
    }

    if (rawTerms.days == null || isNaN(Number(rawTerms.days))) {
      return res.status(400).json({ message: "Valid days is required!" });
    }

    const parsedTerms: ITerm = {
      _id: String(rawTerms._id),
      termName: String(rawTerms.termName).trim(),
      days: Number(rawTerms.days),
    };

    // -----------------------------
    // Parse existing documents
    // -----------------------------
    let finalDocuments: string[] = [];

    if (existingDocuments) {
      const parsedDocs = Array.isArray(existingDocuments)
        ? existingDocuments
        : JSON.parse(existingDocuments);

      finalDocuments = parsedDocs
        .map((doc: any) => (typeof doc === "string" ? doc : doc.doc_file))
        .filter((d: string) => !!d);
    }

    // New uploads
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const uploaded = await imagekit.upload({
          file: file.buffer.toString("base64"),
          fileName: file.originalname,
          folder: "/images",
        });
        finalDocuments.push(uploaded.url);
      }
    }


     for (let item of parsedItems) {
      if (!item.itemName || !item.qty || !item.rate || !item.amount || !item.unit) {
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

    // -----------------------------
    // Assign fields
    // -----------------------------
    saleOrder.branchId = branchId;
    saleOrder.customerId = customerId;
    saleOrder.salesPersonId = salesPersonId || null;
    saleOrder.saleOrderDate = saleOrderDate;
    saleOrder.deliveryDate = deliveryDate;
    saleOrder.status = status;
    saleOrder.items = parsedItems;
    saleOrder.paymentTerms = parsedTerms; // now always assigned
    saleOrder.terms = terms;
    saleOrder.subTotal = subTotal;
    saleOrder.taxTotal = taxTotal;
    saleOrder.reference = reference;
    saleOrder.total = total;
    saleOrder.discount = discountValue;
    saleOrder.documents = finalDocuments;
    saleOrder.note = note;

    await saleOrder.save();

    return res.status(200).json({
      message: "Sale order updated successfully.",
    });
  } catch (err) {
    next(err);
  }
};

export const getAllSaleOrder = async (
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
    let search = ((req.query.search as string) || "").trim();
    search = escapeRegex(search)

    // Date filters
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const statusFilter = (req.query.status as string) || "";

    const allowedStatuses = [
      "Draft",
      "Accepted",
      "Approved",
      "Closed",
      "Confirmed",
      "Invoiced",
      "Pending",
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
      matchStage.saleOrderDate = { $gte: new Date(startDate) };
    } else if (endDate) {
      matchStage.saleOrderDate = { $lte: new Date(endDate) };
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
            { saleOrderId: { $regex: search, $options: "i" } },
            { "customer.name": { $regex: search, $options: "i" } },
            // { "customer.email": { $regex: search, $options: "i" } },
            // { "salesPerson.firstName": { $regex: search, $options: "i" } },
            // { "salesPerson.lastName": { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    // 🔹 Count total after filters
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await SALES_ORDER.aggregate(countPipeline);
    const totalCount = countResult[0]?.total || 0;

    // 🔹 Pagination + sorting
    pipeline.push({ $sort: { createdAt: -1 } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // 🔹 Project fields
    pipeline.push({
      $project: {
        saleOrderId: 1,
        branchId: 1,
        customerId: 1,
        projectId: 1,
        salesPersonId: 1,
        saleOrderDate: 1,
        deliveryDate: 1,
        terms: 1,
        paymentTerms: 1,
        status: 1,
        subTotal: 1,
        reference: 1,
        taxTotal: 1,
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
    const saleOrder = await SALES_ORDER.aggregate(pipeline);

    return res.status(200).json({
      data: saleOrder,
      totalCount,
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
};

export const getOneSaleOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const userId = req.user?.id;
    const { saleOrderId } = req.params; // assuming /quotes/:id

    // 1) Validate ID
    if (!saleOrderId || !Types.ObjectId.isValid(saleOrderId)) {
      return res.status(400).json({ message: "Invalid sale order Id!" });
    }
    const saleObjectId = new Types.ObjectId(saleOrderId);

    // 2) Validate user
    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    // const userRole = user.role; // "CompanyAdmin" or "User"

    // // 3) Determine allowed branch IDs
    // let allowedBranchIds: Types.ObjectId[] = [];

    // if (userRole === "CompanyAdmin") {
    //   const branches = await BRANCH.find({
    //     companyAdminId: userId,
    //     isDeleted: false,
    //   }).select("_id");

    //   allowedBranchIds = branches.map(
    //     (b) => new Types.ObjectId(b._id as Types.ObjectId)
    //   );
    // } else if (userRole === "User") {
    //   if (!user.branchId) {
    //     return res
    //       .status(400)
    //       .json({ message: "User is not assigned to any branch!" });
    //   }
    //   allowedBranchIds = [user.branchId];
    // } else {
    //   return res.status(403).json({ message: "Unauthorized role!" });
    // }

    // 4) Aggregation pipeline
    const pipeline: any[] = [
      {
        $match: {
          _id: saleObjectId,
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
      { $unwind: { path: "$salesPerson", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "items",
          localField: "items.itemId",
          foreignField: "_id",
          as: "itemDetails",
        },
      },

      // You can also lookup branch if you need branch info
      // {
      //   $lookup: {
      //     from: "branches",
      //     localField: "branchId",
      //     foreignField: "_id",
      //     as: "branch",
      //   },
      // },
      // { $unwind: { path: "$branch", preserveNullAndEmptyArrays: true } },

      {
        $project: {
          _id: 1,
          branchId: 1,
          saleOrderId: 1,
          customerId: 1,
          paymentTermsId: 1,
          salesPersonId: 1,
          saleOrderDate: 1,
          deliveryDate: 1,
          status: 1,
          subTotal: 1,
          reference: 1,
          taxTotal: 1,
          total: 1,
          discount: 1,
          documents: 1,
          note: 1,
          terms: 1,
          paymentTerms: 1, // full items array as saved
          createdAt: 1,
          updatedAt: 1,

          items: {
            $map: {
              input: "$items",
              as: "it",
              in: {
                itemId: "$$it.itemId",
                 taxId : "$$it.taxId",
                qty: "$$it.qty",
                tax: "$$it.tax",
                rate: "$$it.rate",
                amount: "$$it.amount",
                unit: "$$it.unit",
                discount: "$$it.discount",
                itemName: {
                  $let: {
                    vars: {
                      matchedItem: {
                        $first: {
                          $filter: {
                            input: "$itemDetails",
                            as: "id",
                            cond: { $eq: ["$$id._id", "$$it.itemId"] },
                          },
                        },
                      },
                    },
                    in: "$$matchedItem.name",
                  },
                },
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
        },
      },
    ];

    const result = await SALES_ORDER.aggregate(pipeline);

    if (!result || result.length === 0) {
      return res.status(404).json({ message: "Sale order not found!" });
    }

    // Since we matched by _id, there will be exactly one
    return res.status(200).json({
      data: result[0],
    });
  } catch (err) {
    next(err);
  }
};

export const deleteSaleOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { saleOrderId } = req.params;

    const userId = req.user?.id;

    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    if (!saleOrderId) {
      return res.status(400).json({ message: "Sale order Id is required!" });
    }

    const saleOrder = await SALES_ORDER.findOne({ _id: saleOrderId });
    if (!saleOrder) {
      return res.status(404).json({ message: "Sale order not found!" });
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

    await SALES_ORDER.findByIdAndUpdate(saleOrderId, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedById: user._id,
      deletedBy: user.username,
    });

    return res.status(200).json({
      message: "Sale order deleted successfully!",
    });
  } catch (err) {
    next(err);
  }
};
