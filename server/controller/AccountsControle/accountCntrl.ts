import ACCOUNTS from "../../models/accounts";
import express, { Response, Request, NextFunction } from "express";
import USER from "../../models/user";
import TRANSACTION from "../../models/transactions";
import { Types } from "mongoose";
import { resolveUserAndAllowedBranchIds } from "../../Helper/branch-access.helper";
import userModel from "../../models/user";
import branchModel from "../../models/branch";

export const createAccounts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { branchId, accountName, accountType, description, parentAccountId } =
      req.body;

    const userId = req.user?.id;

    // Validate user
    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) return res.status(400).json({ message: "User not found!" });

    if (!branchId) {
      return res.status(400).json({ message: "Branch Id is reqruired!" });
    }
    if (!accountType) {
      return res.status(400).json({ message: "Account Type is required!" });
    }

    if (!accountName) {
      return res.status(400).json({ message: "Account name is required!" });
    }

    const existing = await ACCOUNTS.findOne({ branchId, accountName, isDeleted:false });
    if (existing) {
      return res.status(400).json({ message: "Account name already exists." });
    }

    if (parentAccountId) {
      const parent = await ACCOUNTS.findOne({ _id: parentAccountId, branchId });

      if (!parent) {
        return res.status(400).json({ message: "Parent account not found." });
      }
    }
    

    await ACCOUNTS.create({
      branchId,
      accountName,
      accountType,
      description,
      // openingBalance: parseFloat((openingBalance|| 0).toFixed(2)),
      parentAccountId: parentAccountId || null,
      createdById: user._id,
      //   createdBy:user.name,
    });

    res.status(201).json({
      message: "Account created successfully.",
    });
  } catch (err) {
    next(err);
  }
};

export const getAccounts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const userId = req.user?.id;

    // validate user
    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    const branchId = req.query.branchId as string;

    if (!branchId) {
      return res.status(400).json({ message: "Branch Id is required!" });
    }

    // pagination
    const limit = parseInt(req.query.limit as string) || 20;
    const page = parseInt(req.query.page as string) || 1;
    const skip = (page - 1) * limit;
    const filterBranchId = req.query.branchId as string;
    const { allowedBranchIds } = await resolveUserAndAllowedBranchIds({
      userId: userId as string,
      userModel: userModel,
      branchModel: branchModel,
      requestedBranchId: filterBranchId,
    });

    // search term
    const search = ((req.query.search as string) || "").trim();

    const match: any = {
      isDeleted: false,
      branchId: { $in: allowedBranchIds },
    };

    // only add search filter when search has value
    if (search.length > 0) {
      match.$or = [
        { accountName: { $regex: search, $options: "i" } },
        { accountType: { $regex: search, $options: "i" } },
      ];
    }

    // pipeline
    const pipeline: any[] = [
      { $match: match },

      {
        $lookup: {
          from: "accounts",
          localField: "parentAccountId",
          foreignField: "_id",
          as: "parentAccount",
        },
      },
      {
        $unwind: {
          path: "$parentAccount",
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    // allow search on parent name too
    if (search.length > 0) {
      pipeline.push({
        $match: {
          $or: [
            { accountName: { $regex: search, $options: "i" } },
            { accountType: { $regex: search, $options: "i" } },
            { "parentAccount.accountName": { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    // projection
    pipeline.push({
      $project: {
        _id: 1,
        branchId,
        accountName: 1,
        accountType: 1,
        description: 1,
        createdAt: 1,
        parentAccountId: "$parentAccount._id",
        parentAccountName: "$parentAccount.accountName",
        updatedAt: 1,
      },
    });

    // sorting & pagination
    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    );

    const accounts = await ACCOUNTS.aggregate(pipeline);

    // total count for pagination
    const totalCount = await ACCOUNTS.countDocuments(match);

    return res.status(200).json({
      data: accounts,
      totalCount,
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
};

export const updateAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const {
      accountId,
      branchId,
      accountName,
      accountType,
      description,
      parentAccountId,
    } = req.body;

    const userId = req.user?.id;

    // validate user
    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    if (!accountId) {
      return res.status(400).json({ message: "Account ID is required!" });
    }

    // fetch existing
    const account = await ACCOUNTS.findOne({
      _id: accountId,
      isDeleted: false,
    });
    if (!account) {
      return res.status(404).json({ message: "Account not found!" });
    }

    if (!branchId) {
      return res.status(400).json({ message: "Branch Id is required!" });
    }

    if (!accountType) {
      return res.status(400).json({ message: "Account Type is required!" });
    }

    if (!accountName) {
      return res.status(400).json({ message: "Account name is required!" });
    }

    // check duplicate account name (exclude current one)
    const existing = await ACCOUNTS.findOne({
      _id: { $ne: accountId },
      branchId,
      accountName,
      isDeleted: false,
    });

    if (existing) {
      return res.status(400).json({ message: "Account name already exists." });
    }

    // validate parent
    if (parentAccountId) {
      const parent = await ACCOUNTS.findOne({
        _id: parentAccountId,
        branchId,
        isDeleted: false,
      });

      if (!parent) {
        return res.status(400).json({ message: "Parent account not found." });
      }

      // prevent account setting itself as parent
      if (parentAccountId === accountId) {
        return res.status(400).json({
          message: "An account cannot be parent of itself.",
        });
      }
    }

    // perform update
    await ACCOUNTS.findByIdAndUpdate(
      accountId,
      {
        branchId,
        accountName,
        accountType,
        description,
        parentAccountId: parentAccountId || null,
        updatedAt: new Date(),
      },
      { new: true }
    );

    return res.status(200).json({ message: "Account updated successfully." });
  } catch (err) {
    next(err);
  }
};

export const deleteAcccount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const userId = req.user?.id;

    const { accountId } = req.params;

    // Validate user
    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) return res.status(400).json({ message: "User not found!" });

    if (!accountId) {
      return res.status(400).json({ message: "Account Id is required!" });
    }

    const account = await ACCOUNTS.findOne({ _id: accountId });
    if (!account) {
      return res.status(404).json({ message: "Account not found!" });
    }

    await ACCOUNTS.findByIdAndUpdate(accountId, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedById: user._id,
      // deletedBy: user.name,
    });

    return res.status(200).json({
      message: "Account deleted successfully!",
    });
  } catch (err) {
    next(err);
  }
};
