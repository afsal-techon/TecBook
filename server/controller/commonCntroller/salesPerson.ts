import SALES_PERSON from "../../models/salesPerson";
import express, { Request, Response, NextFunction } from "express";
import { ICustomer, ISalesPerson } from "../../types/common.types";
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
      email
    } = req.body as ISalesPerson;

    const userId = req.user?.id;

    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    if (!branchId) {
      return res.status(400).json({ message: "Branch ID is required!" });
    }
      if (!name) {
      return res.status(400).json({ message: "Name  is required!" });
    }
      if (!email) {
      return res.status(400).json({ message: "Email ID is required!" });
    }


    const existEmail = await SALES_PERSON.findOne({
      email,
      branchId,
      isDeleted: false,
    });
    if (existEmail)
      return res.status(400).json({ message: "Email is already exists!" });

    await SALES_PERSON.create({
      branchId,
      name,
      email,
     createdById: user._id,
    });

    return res.status(200).json({ message: "Sales person created successfully" });
  } catch (err) {
    next(err);
  }
};

export const updateSalesPerson = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const {
      branchId,
      name,
      email,
    } = req.body; // allow partial

    const userId = req.user?.id;
    const { salesPersonId } = req.params;


    // Validate user
    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }


    if (!salesPersonId) {
      return res.status(400).json({ message: "SalesPerson id is required!" });
    }

    // Check if customer exists
    const salesPerson = await SALES_PERSON.findOne({
      _id: salesPersonId,
      isDeleted: false,
    });
    if (!salesPerson) {
      return res.status(404).json({ message: "Sales person not found!" });
    }

    if (email && email !== salesPerson.email) {
      const existPhone = await SALES_PERSON.findOne({
        email,
        branchId: branchId || salesPerson.branchId,
        _id: { $ne: salesPersonId },
      });

      if (existPhone) {
        return res.status(400).json({
          message: "Email already exists for another sales person!",
        });
      }
    }

    // Build update object — take new values if given, else keep old
    const updateData = {
      branchId: branchId ?? salesPerson.branchId,
      name: name ?? salesPerson.name,
      email: email ?? salesPerson.email,
    };
  
    await SALES_PERSON.findByIdAndUpdate(salesPersonId, updateData, { new: true });
    await salesPerson.save();

    return res.status(200).json({
      message: "Sales person updated successfully!",
    });
  } catch (err) {
    next(err);
  }
};


export const getSalesPerson = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const userId = req.user?.id;

    const { branchId } = req.params;

    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    const salesPerson = await SALES_PERSON.find({ branchId,isDeleted:false });

    return res.status(200).json({
      data: salesPerson
    });
  } catch (err) {
    next(err);
  }
};


export const deleteSalesPerson = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const userId = req.user?.id;

    const { salesPersonId } = req.params;

    // Validate user
    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) return res.status(400).json({ message: "User not found!" });

    if (!salesPersonId) {
      return res.status(400).json({ message: "Sales person Id is required!" });
    }

    const customer = await SALES_PERSON.findOne({ _id: salesPersonId });
    if (!customer) {
      return res.status(404).json({ message: "Sales person not found!" });
    }

    await SALES_PERSON.findByIdAndUpdate(salesPersonId, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedById: user._id,
      // deletedBy: user.name,
    });

    return res.status(200).json({
      message: "Sales person deleted successfully!",
    });
  } catch (err) {
    next(err);
  }
};


