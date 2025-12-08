import INVOICE from "../../models/invoice";
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


export const createInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const {
      branchId,
      invoiceId, // may be null/ignored in auto mode
      customerId,
      salesPersonId,
      invoiceDate,
      dueDate,
      status,
      orderNumber,
      subject,
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
    if (!invoiceDate)
      return res.status(400).json({ message: "Invoice Date is required!" });
    if (!dueDate)
      return res.status(400).json({ message: "Due Date is required!" });
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
      docType: "INVOICE",
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
      const exists = await INVOICE.findOne({
        branchId: new Types.ObjectId(branchId),
        invoiceId: finalQuoteId,
        isDeleted: false,
      });
      if (exists) {
        return res.status(400).json({
          message: "Generated invoice Id already exists. Please try again.",
        });
      }

      // increment for next time
      setting.nextNumber = numeric + 1;
      setting.nextNumberRaw = String(numeric + 1).padStart(length, "0");
      await setting.save();
    } else {
      // ---------- MANUAL MODE ----------
      if (
        !invoiceId ||
        typeof invoiceId !== "string" ||
        !invoiceId.trim()
      ) {
        return res
          .status(400)
          .json({ message: "Invoice Id is required in manual mode!" });
      }

      finalQuoteId = invoiceId.trim();

      // ensure unique
      const exists = await INVOICE.findOne({
        branchId: new Types.ObjectId(branchId),
        invoiceId: finalQuoteId,
        isDeleted: false,
      });
      if (exists) {
        return res.status(400).json({
          message: "This invoice Id already exists. Please enter a different one.",
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

    const invoice = new INVOICE({
      branchId: new Types.ObjectId(branchId),
      invoiceId: finalQuoteId, //  always use this
      customerId: new Types.ObjectId(customerId),
      // projectId: projectId ? new Types.ObjectId(projectId) : null,
      salesPersonId: salesPersonId ? new Types.ObjectId(salesPersonId) : null,
      invoiceDate,
      dueDate,
      status,
      items: parsedItems,
      paymentTerms: parsedTerms,
      terms,
      orderNumber,
      subject,
      subTotal,
      taxTotal,
      total,
      discount: discountValue,
      documents: uploadedFiles,
      note,
      createdById: userId,
    });

    await invoice.save();

    return res.status(201).json({
      message: `Invoice created successfully.`,
      invoiceId: finalQuoteId,
    });
  } catch (err) {
    next(err);
  }
};


export const updateInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { invoiceId } = req.params;

    const {
      branchId,
      customerId,
      salesPersonId,
      invoiceDate,
      dueDate,
      status,
      items,
      subTotal,
      terms,
      paymentTerms,
      orderNumber,
      subject,
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
    if (!invoiceId)
      return res.status(400).json({ message: "Invoice Id is required!" });

    const invoice = await INVOICE.findOne({
      _id: invoiceId,
      isDeleted: false,
    });

    if (!invoice)
      return res.status(400).json({ message: "Invoice not found!" });

    // Required fields
    if (!branchId)
      return res.status(400).json({ message: "Branch ID is required!" });
    if (!customerId)
      return res.status(400).json({ message: "Customer ID is required!" });
    if (!invoiceDate)
      return res.status(400).json({ message: "Invoice date is required!" });
    if (!dueDate)
      return res.status(400).json({ message: "Due  date is required!" });
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

    // -----------------------------
    // Assign fields
    // -----------------------------
    invoice.branchId = branchId;
    invoice.customerId = customerId;
    invoice.salesPersonId = salesPersonId || null;
    invoice.invoiceDate = invoiceDate;
    invoice.dueDate = dueDate;
    invoice.status = status;
    invoice.items = parsedItems;
    invoice.paymentTerms = parsedTerms; // now always assigned
    invoice.terms = terms;
    invoice.subTotal = subTotal;
    invoice.subject = subject;
    invoice.taxTotal = taxTotal;
    invoice.orderNumber = orderNumber;
    invoice.total = total;
    invoice.discount = discountValue;
    invoice.documents = finalDocuments;
    invoice.note = note;

    await invoice.save();

    return res.status(200).json({
      message: "Invoice updated successfully.",
    });
  } catch (err) {
    next(err);
  }
};