import VENDOR from "../../models/vendor";
import express, { Request, Response, NextFunction } from "express";
import { IVendor } from "../../types/common.types";
import USER from "../../models/user";
import { Types } from "mongoose";
import mongoose from "mongoose";
import BRANCH from "../../models/branch";
import { imagekit } from "../../config/imageKit";

export const CreateVendor = async (
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
    } = req.body as IVendor;

    const userId = req.user?.id;

    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }
    if (!branchId) {
      return res.status(400).json({ message: "Branch ID is required!" });
    }

    if (!name) {
      return res.status(400).json({ message: "Name is required!" });
    }
    if (!phone) {
      return res.status(400).json({ message: "Phone number is required!" });
    }
    if (typeof req.body.billingInfo === "string") {
      req.body.billingInfo = JSON.parse(req.body.billingInfo);
    }

    if (typeof req.body.shippingInfo === "string") {
      req.body.shippingInfo = JSON.parse(req.body.shippingInfo);
    }
    if (!taxTreatment) {
      return res.status(400).json({ message: "Tax treatment is required!" });
    }

    const existContact = await VENDOR.findOne({
      phone,
      branchId,
      isDeleted: false,
    });
    if (existContact)
      return res
        .status(400)
        .json({ message: "Phone number is already exists!" });

    const existEmail = await VENDOR.findOne({
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

    await VENDOR.create({
      branchId,
      name,
      phone,
      openingBalance,
      billingInfo: req.body.billingInfo,
      shippingInfo: req.body.shippingInfo,
      taxTreatment,
      trn,
      email,
      currency,
      paymentTerms,
      note,
      placeOfSupplay,
      documents: uploadedDocuments,
      createdById: user._id,
    });

    return res.status(200).json({ message: "Vendor created successfully" });
  } catch (err) {
    next(err);
  }
};

export const getVendors = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const userId = req.user?.id;

    // 🔹 Validate user
    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    const userRole = user.role; // "CompanyAdmin" | "User"
    const filterBranchId = req.query.branchId as string;
    const search = ((req.query.search as string) || "").trim();

    const paginate: boolean = req.query.paginate !== "false";

    // 🔹 Pagination
    const page = paginate ? Math.max(Number(req.query.page) || 1, 1) : 1;
    const limit = paginate ? Math.max(Number(req.query.limit) || 10, 1) : 10;
    const skip = paginate ? (page - 1) * limit : 0;

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

    // 🔹 Match stage
    const matchStage: any = {
      branchId: { $in: allowedBranchIds },
      isDeleted: false,
    };

    // 🔹 Search condition
    if (search) {
      matchStage.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const projectStage = paginate
      ? {
          _id: 1,
          branchId: 1,
          name: 1,
          phone: 1,
          email: 1,
          currency: 1,
          paymentTerms: 1,
          openingBalance: 1,
          billingInfo: 1,
          shippingInfo: 1,
          taxTreatment: 1,
          trn: 1,
          placeOfSupplay: 1,
          createdAt: 1,
          updatedAt: 1,
        }
      : {
          _id: 1,
          name: 1,
        };

    // 🔹 Aggregation pipeline
    const pipeline: any[] = [
      { $match: matchStage },
      { $project: projectStage },
      { $sort: { createdAt: -1 } },
    ];

    if (paginate) {
      pipeline.push({ $skip: skip }, { $limit: limit });
    }

    const vendors = await VENDOR.aggregate(pipeline);

    //  Total count for pagination
    const totalCount = await VENDOR.countDocuments(matchStage);

    return res.status(200).json({
      data: vendors,
      totalCount,
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
};

export const updateVendor = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const {
      vendorId,
      branchId,
      name,
      phone,
      email,
      currency,
      paymentTerms,
      openingBalance,
      taxTreatment,
      trn,
      note,
      placeOfSupplay,
      existingDocuments,
    } = req.body; // allow partial

    const userId = req.user?.id;

    // Validate user
    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    if (!vendorId) {
      return res.status(400).json({ message: "Vendor ID is required!" });
    }
    if (typeof req.body.billingInfo === "string") {
      req.body.billingInfo = JSON.parse(req.body.billingInfo);
    }

    if (typeof req.body.shippingInfo === "string") {
      req.body.shippingInfo = JSON.parse(req.body.shippingInfo);
    }

    // Check if customer exists
    const vendor = await VENDOR.findOne({ _id: vendorId, isDeleted: false });
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found!" });
    }

    // Duplicate phone check if updating phone
    if (phone && phone !== vendor.phone) {
      const existContact = await VENDOR.findOne({
        phone,
        branchId: branchId || vendor.branchId,
        _id: { $ne: vendorId },
      });

      if (existContact) {
        return res.status(400).json({
          message: "Phone number already exists for another Vendor!",
        });
      }
    }

    if (email && email !== vendor.email) {
      const existPhone = await VENDOR.findOne({
        email,
        branchId: branchId || vendor.branchId,
        _id: { $ne: vendorId },
      });

      if (existPhone) {
        return res.status(400).json({
          message: "Phone number already exists for another vendor!",
        });
      }
    }

    let finalDocuments: Array<{
      doc_name: string;
      doc_file: string;
      doc_typeId: Types.ObjectId | null;
      startDate: Date | null;
      endDate: Date | null;
    }> = [];

    if (existingDocuments) {
      // front-end sends existingDocuments as JSON string
      const parsedExistingDocs = Array.isArray(existingDocuments)
        ? existingDocuments
        : JSON.parse(existingDocuments);

      finalDocuments = parsedExistingDocs.map((doc: any) => ({
        doc_name: doc.doc_name,
        doc_file: doc.doc_file,
        doc_typeId: doc.doc_typeId ? new Types.ObjectId(doc.doc_typeId) : null,
        startDate: doc.startDate,
        endDate: doc.endDate,
      }));
    }

    const documentsMetadata = req.body.metadata
      ? JSON.parse(req.body.metadata)
      : [];

    if (req.files && Array.isArray(req.files)) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const meta = documentsMetadata[i] || {};

        const uploadResponse = await imagekit.upload({
          file: file.buffer.toString("base64"),
          fileName: file.originalname,
          folder: "/images",
        });

        finalDocuments.push({
          doc_name: meta.doc_name || file.originalname || "",
          doc_file: uploadResponse.url || "",
          doc_typeId: meta.doc_typeId
            ? new Types.ObjectId(meta.doc_typeId)
            : null,
          startDate: meta.startDate,
          endDate: meta.endDate,
        });
      }
    }

    // Build update object — take new values if given, else keep old
    const updateData = {
      branchId: branchId ?? vendor.branchId,
      name: name ?? vendor.name,
      phone: phone ?? vendor.phone,
      openingBalance: openingBalance ?? vendor.openingBalance,
      billingInfo: req.body.billingInfo ?? vendor.billingInfo,
      shippingInfo: req.body.shippingInfo ?? vendor.shippingInfo,
      taxTreatment: taxTreatment ?? vendor.taxTreatment,
      trn: trn ?? vendor.trn,
      currency: currency ?? vendor.currency,
      paymentTerms: paymentTerms ?? vendor.paymentTerms,
      email: email ?? vendor.email,
      note: note ?? vendor.note,
      placeOfSupplay: placeOfSupplay ?? vendor.placeOfSupplay,
    };

    await VENDOR.findByIdAndUpdate(vendorId, updateData, { new: true });

    vendor.documents = finalDocuments;
    await vendor.save();

    return res.status(200).json({
      message: "Vendor updated successfully!",
    });
  } catch (err) {
    next(err);
  }
};

export const deleteVendor = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const userId = req.user?.id;

    const { vendorId } = req.params;

    // Validate user
    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) return res.status(400).json({ message: "User not found!" });

    if (!vendorId) {
      return res.status(400).json({ message: "Vendor Id is required!" });
    }

    const vendor = await VENDOR.findOne({ _id: vendorId });
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found!" });
    }

    await VENDOR.findByIdAndUpdate(vendorId, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedById: user._id,
      // deletedBy: user.name,
    });

    return res.status(200).json({
      message: "Vendor deleted successfully!",
    });
  } catch (err) {
    next(err);
  }
};
