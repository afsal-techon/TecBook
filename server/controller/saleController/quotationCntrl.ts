import USER from "../../models/user";
import QUOTATION from "../../models/quotation";
import express, { Request, Response, NextFunction } from "express";
import CUSTOMER from "../../models/customer";
import { imagekit } from "../../config/imageKit";
import { Types } from "mongoose";
import BRANCH from '../../models/branch'

export const createQuotes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const {
      branchId,
      quoteId,
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
    if (!quoteId)
      return res.status(400).json({ message: "Quote ID is required!" });
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
      quoteId,
      customerId: new Types.ObjectId(customerId),
      projectId: projectId ? new Types.ObjectId(projectId) : null,
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

         // ✅ Send email only if status = "Sent"
    // if (status === "Sent" && customer.email) {
    //   await sendEmail({
    //     to: customer.email,
    //     subject: `Quotation #${quoteId}`,
    //     html: `
    //       <h3>Dear ${customer.name || "Customer"},</h3>
    //       <p>Your quotation <b>#${quoteId}</b> has been sent successfully.</p>
    //       <p>Total Amount: <b>${total}</b></p>
    //       <p>Thank you for your business!</p>
    //     `,
    //   });
    // }

     return res.status(201).json({
      message: `Quotation created successfully.`,
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
    existingQuote.projectId = projectId ? new Types.ObjectId(projectId) : null;
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


