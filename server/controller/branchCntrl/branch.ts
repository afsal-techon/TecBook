import express, { NextFunction, Request, Response } from "express";
import USER from "../../models/user";
import { createBranchBody } from "../../types/common.types";
import BRANCH from "../../models/branch";

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
      branchCode,
      country,
      state,
      city,
      address,
      contact1,
      contact2,
      email,
      logo,
      vatPercentage,
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
    if (!contact1)
      return res.status(400).json({ message: "Contact number is required!" });
    if (!vatPercentage)
      return res.status(400).json({ message: "Vat is required!" });
    if (!currency)
      return res.status(400).json({ message: "Currency is required!" });
    if (!currencySymbol)
      return res.status(400).json({ message: "Currency symbol is required!" });

    await BRANCH.create({
      comapnyAdminId: user._id,
      branchName,
      branchCode,
      country,
      state,
      city,
      logo,
      address,
      contact1,
      contact2,
      currency,
      currencySymbol,
      vatPercentage,
      email,
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

    let branches: any = [];

    if (user.role === "CompanyAdmin") {
      branches = await BRANCH.find({
        comapnyAdminId: user._id,
        isDeleted: false,
      });
    } else if (user.role === "User") {
      const branchId = user.branchId;
      const branch = await BRANCH.findOne({
        _id: branchId,
        isDeleted: false,
      });
      if (branch) {
        branches = [branch];
      }
    }

    return res.status(200).json({data:  branches });
  } catch (err) {
    next(err);
  }
};
