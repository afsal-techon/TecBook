import SALES_PERSON from "../../models/salesPerson";
import express, { Request, Response, NextFunction } from "express";
import { ICustomer } from "../../types/common.types";
import USER from "../../models/user";
import { Types } from "mongoose";
import mongoose from "mongoose";
import BRANCH from '../../models/branch'


export const createSalesPerson = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const {
      branchId,
      name,
      phone,
      note,
      openingBalance,
      email,
      currency,
      paymentTerms,
      taxTreatment,
      trn,
      placeOfSupplay,
    } = req.body as ICustomer;

   

    const userId = req.user?.id;

    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }


    if (!branchId) {
      return res.status(400).json({ message: "Branch ID is required!" });
    }

    if(typeof req.body.billingInfo ==='string'){
       req.body.billingInfo = JSON.parse(req.body.billingInfo);
    }

    if(typeof req.body.shippingInfo ==='string'){
       req.body.shippingInfo = JSON.parse(req.body.shippingInfo);
    }

    if (!name) {
      return res.status(400).json({ message: "Name is required!" });
    }
    if (!phone) {
      return res.status(400).json({ message: "Phone number is required!" });
    }
    if (!req.body.billingInfo) {
      return res.status(400).json({ message: "Billing address is required!" });
    }

    if (!req.body.shippingInfo) {
      return res.status(400).json({ message: "Shipping address is required!" });
    }
    if (!taxTreatment) {
      return res.status(400).json({ message: "Tax treatment is required!" });
    }

    // if (!trn) {
    //   return res.status(400).json({ message: "trn is required!" });
    // }

    // if (!placeOfSupplay) {
    //   return res.status(400).json({ message: "Place of supplay required!" });
    // }

    const existContact = await CUSTOMER.findOne({
      phone,
      branchId,
      isDeleted: false,
    });
    if (existContact)
      return res
        .status(400)
        .json({ message: "Phone number is already exists!" });

    const existEmail = await CUSTOMER.findOne({
      email,
      branchId,
      isDeleted: false,
    });
    if (existEmail)
      return res.status(400).json({ message: "Email is already exists!" });

    let uploadedDocuments: Array<{
      doc_name: string;
      doc_file: string;
      doc_typeId: Types.ObjectId | null;
      startDate: Date | null;
      endDate: Date | null;
    }> = [];
    const documentsMetadata = req.body.metadata
      ? JSON.parse(req.body.metadata)
      : [];

    if (req.files && Array.isArray(req.files)) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const meta = documentsMetadata[i] || {}; // fallback in case metadata missing

        const uploadResponse = await imagekit.upload({
          file: file.buffer.toString("base64"),
          fileName: file.originalname,
          folder: "/images",
        });

        uploadedDocuments.push({
          doc_name: meta.doc_name || file.originalname,
          doc_file: uploadResponse.url,
          doc_typeId: meta.doc_typeId
            ? new Types.ObjectId(meta.doc_typeId)
            : null,
          startDate: meta.startDate,
          endDate: meta.endDate,
        });
      }
    }

    await CUSTOMER.create({
      branchId,
      name,
      phone,
      openingBalance,
      billingInfo : req.body.billingInfo,
      shippingInfo :req.body.shippingInfo,
      taxTreatment,
      trn,
      email,
      note,
      paymentTerms,
      currency,
      placeOfSupplay,
      createdById: user._id,
       documents: uploadedDocuments,
    });

    return res.status(200).json({ message: "Customer created successfully" });
  } catch (err) {
    next(err);
  }
};