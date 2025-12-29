import { NextFunction, Request, Response } from "express";
import mongoose, { Types, Model } from "mongoose";
import { GenericDatabaseService } from "../../Helper/GenericDatabase";
import {
  ExpenseModel,
  ExpenseModelConstants,
  ExpenseModelDocument,
} from "../../models/ExpenseModel";
import {
  CreateExpenseDto,
  UpdateExpenseDto,
} from "../../dto/create-expense.dto";
import { IUser } from "../../types/user.types";
import userModel from "../../models/user";
import branchModel from "../../models/branch";
import vendorModel from "../../models/vendor";
import { IBranch, IVendor } from "../../types/common.types";
import { HTTP_STATUS } from "../../constants/http-status";
import { ItemDto } from "../../dto/item.dto";
import { IItem } from "../../Interfaces/item.interface";
import { resolveUserAndAllowedBranchIds } from "../../Helper/branch-access.helper";

class ExpenseController extends GenericDatabaseService<ExpenseModelDocument> {
  private readonly userModel: Model<IUser>;
  private readonly branchModel: Model<IBranch>;
  private readonly vendorModel: Model<IVendor>;

  constructor() {
    super(ExpenseModel);
    this.userModel = userModel;
    this.branchModel = branchModel;
    this.vendorModel = vendorModel;
  }

  createExpense = async (
    req: Request<{}, {}, CreateExpenseDto>,
    res: Response
  ) => {
    try {
      const dto = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: "Unauthorized",
        });
      }
      if (!this.isValidMongoId(userId)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Invalid user id",
        });
      }

      await this.validateUser(userId);
      await this.validateVendor(dto.vendorId);
      await this.validateBranch(dto.branchId);

      const items: IItem[] = this.mapItems(dto.items);

      const payload = {
        date: dto.date ? new Date(dto.date) : new Date(),
        expenseNumber: dto.expenseNumber, // TODO: auto increment
        customerId: new Types.ObjectId(dto.customerId),
        branchId: new Types.ObjectId(dto.branchId),
        taxPreference: dto.taxPreference,
        paidAccount: new Types.ObjectId(dto.paidAccount),
        vendorId: new Types.ObjectId(dto.vendorId),
        items,
        createdBy: new Types.ObjectId(userId),
      };

      const expense = await this.genericCreateOne(payload);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: "Expense created successfully",
        data: expense,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log("Error while creating expense", error.message);
        throw new Error(error.message);
      }
      console.log("Error while creating expense", error);
      throw new Error("failed to create expense");
    }
  };

  private async validateBranch(id: string) {
    const branch = await this.branchModel.findOne({
      _id: id,
      isDeleted: false,
    });
    if (!branch) throw new Error("Branch not found");
    return branch;
  }

  private async validateUser(id: string) {
    const user = await this.userModel.findOne({
      _id: id,
      isDeleted: false,
    });
    if (!user) throw new Error("User not found");
    return user;
  }

  private async validateVendor(vendorId: string) {
    const vendor = await this.vendorModel.findOne({
      _id: vendorId,
      isDeleted: false,
    });
    if (!vendor) throw new Error("Vendor not found");
  }

  private mapItems(itemsDto: ItemDto[]): IItem[] {
    return itemsDto.map((item) => ({
      itemId: item.itemId ? new Types.ObjectId(item.itemId) : undefined,
      taxId: item.taxId ? new Types.ObjectId(item.taxId) : undefined,
      itemName: item.itemName,
      qty: item.qty,
      tax: item.tax,
      rate: item.rate,
      amount: item.amount,
      unit: item.unit,
      discount: item.discount,
    }));
  }
}

export const expenseController = new ExpenseController();
