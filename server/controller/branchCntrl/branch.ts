import express, { NextFunction, Request, Response } from "express";
import USER from "../../models/user";
import { createBranchBody } from "../../types/common.types";
import BRANCH from "../../models/branch";
import { upload } from "../../middleware/imgUpload";
import { imagekit } from "../../config/imageKit";

export const createBranch = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const userId = req.user?.id;

    const user = await USER.findById(userId);
    if (!user) return res.status(400).json({ message: "User not found!" });

    if (user.role != "CompanyAdmin")
      return res
        .status(400)
        .json({ message: "Only company admin can create branch" });

    const {
      branchName,
      country,
      state,
      city,
      address,
      phone,
      trn,
      landline,
      // vatPercentage,
      currency,
      currencySymbol,
    } = req.body as createBranchBody;

    if (!branchName)
      return res.status(400).json({ message: "Branch name is required!" });
    if (!country)
      return res.status(400).json({ message: "Country is required!" });
    if (!state) return res.status(400).json({ message: "State is required!" });
    if (!city) return res.status(400).json({ message: "City is required!" });
    if (!address)
      return res.status(400).json({ message: "Address is required!" });
    if (!phone)
      return res.status(400).json({ message: "Contact number is required!" });
    // if (!vatPercentage)
    //   return res.status(400).json({ message: "Vat is required!" });
    if (!currency)
      return res.status(400).json({ message: "Currency is required!" });
    if (!currencySymbol)
      return res.status(400).json({ message: "Currency symbol is required!" });

    let uploadedLogoUrl = null;

    if (req.file) {
      const uploadResponse = await imagekit.upload({
        file: req.file.buffer.toString("base64"),
        fileName: req.file.originalname,
        folder: "/images",
      });
      uploadedLogoUrl = uploadResponse.url;
    }

    await BRANCH.create({
      comapnyAdminId: user._id,
      branchName,
      country,
      state,
      city,
      logo: uploadedLogoUrl || null,
      address,
      phone,
      trn,
      currency,
      currencySymbol,
      landline,
    });

    return res.status(200).json({ message: "Branch created successfully" });
  } catch (err) {
    next(err);
  }
};



export const getAllBranches = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const userId = req.user?.id;

    const user = await USER.findById(userId);
    if (!user) return res.status(400).json({ message: "User not found!" });

    const limit = parseInt(req.query.limit as string) || 20;
    const page = parseInt(req.query.page as string) || 1;
    const skip = (page - 1) * limit;
    const search = req.query.search as string || "";

    const query: any = { isDeleted: false };

    if (user.role === "CompanyAdmin") {
      query.comapnyAdminId = user._id;
    } else if (user.role === "User") {
      query._id = user.branchId;
    }

    // Search filter for branchName
    if (search) {
      query.branchName = { $regex: search, $options: "i" };
    }

    // Get total count for pagination
    const totalCount = await BRANCH.countDocuments(query);

    // Fetch paginated data
    const branches = await BRANCH.find(query)
      .sort({ createdAt: -1 }) // latest first
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      data: branches,
      totalCount,
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
};


export const updateBranch = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const userId = req.user?.id;

    const user = await USER.findById(userId);
    if (!user) return res.status(400).json({ message: "User not found!" });

    if (user.role !== "CompanyAdmin")
      return res
        .status(403)
        .json({ message: "Only company admin can update branch" });

    // Find existing branch


    // Extract updated fields from request body
    const {
      branchId,
      branchName,
      country,
      state,
      city,
      address,
      phone,
      trn,
      landline,
      currency,
      currencySymbol,
    } = req.body;

        if (!branchId) {
      return res.status(400).json({ message: "Branch ID is required!" });
    }  
    
    const branch = await BRANCH.findById(branchId);
    if (!branch) return res.status(404).json({ message: "Branch not found!" });

    let uploadedLogoUrl = branch.logo; // keep existing logo by default

    // If new file is uploaded, upload to ImageKit
    if (req.file) {
      const uploadResponse = await imagekit.upload({
        file: req.file.buffer.toString("base64"),
        fileName: req.file.originalname,
        folder: "/images",
      });
      uploadedLogoUrl = uploadResponse.url;
    }

    // Update branch fields
    branch.branchName = branchName || branch.branchName;
    branch.country = country || branch.country;
    branch.state = state || branch.state;
    branch.city = city || branch.city;
    branch.address = address || branch.address;
    branch.phone = phone || branch.phone;
    branch.trn = trn || branch.trn;
    branch.landline = landline || branch.landline;
    branch.currency = currency || branch.currency;
    branch.currencySymbol = currencySymbol || branch.currencySymbol;
    branch.logo = uploadedLogoUrl;

    await branch.save();

    return res.status(200).json({ message: "Branch updated successfully" });
  } catch (err) {
    next(err);
  }
};