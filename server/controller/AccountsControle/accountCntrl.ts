import ACCOUNTS from "../../models/accounts";
import express, { Response, Request, NextFunction } from "express";
import USER from "../../models/user";

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

    const existing = await ACCOUNTS.findOne({ branchId, accountName });
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

    // Validate user
    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) return res.status(400).json({ message: "User not found!" });


        const accounts = await ACCOUNTS.find({  })
      .populate({ path: 'parentAccountId', select: 'accountName' });

          const transactions = await TRANSACTION.aggregate([
      {
        $group: {
          _id: '$accountId',
          totalCredit: {
            $sum: {
              $cond: [{ $eq: ['$type', 'Credit'] }, '$amount', 0]
            }
          },
          totalDebit: {
            $sum: {
              $cond: [{ $eq: ['$type', 'Debit'] }, '$amount', 0]
            }
          }
        }
      }
    ]);



   
  } catch (err) {
    next(err);
  }
};