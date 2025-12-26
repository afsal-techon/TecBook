import { Request, Response, NextFunction } from "express";
import mongoose, { Model, Types } from "mongoose";
import { GenericDatabaseService } from "../../Helper/GenericDatabase";
import { IBillingRecords } from "../../Interfaces/billing-records.interface";
import { BillingSchemaModel } from "../../models/BillingRecordsModel";
import { CreateBillingRecordsDTO } from "../../dto/billing-records.dto";
import { HTTP_STATUS } from "../../constants/http-status";
import vendorModel from "../../models/vendor";
import branchModel from "../../models/branch";
import { IBranch, IProject, IVendor } from "../../types/common.types";
import { IUser } from "../../types/user.types";
import userModel from "../../models/user";
import projectModel from "../../models/project";
import purchaseOrderController from "../PurchaseOrderController/purchase-order.controller";
import { ItemDto } from "../../dto/item.dto";
import { IItem } from "../../Interfaces/item.interface";

class BillingRecordsController extends GenericDatabaseService<
  Model<IBillingRecords>
> {
  private readonly vendorModel: Model<IVendor>;
  private readonly userModel: Model<IUser>;
  private readonly branchModel: Model<IBranch>;
  constructor(
    dbModel: Model<IBillingRecords>,
    vendorModel: Model<IVendor>,
    userModel: Model<IUser>,
    branchModel: Model<IBranch>,
    private readonly purchaseOrderService = purchaseOrderController
  ) {
    super(dbModel);
    this.vendorModel = vendorModel;
    this.userModel = userModel;
    this.branchModel = branchModel;
  }

  createBillingRecords = async (
    req: Request<{}, {}, CreateBillingRecordsDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const dto: CreateBillingRecordsDTO = req.body;
      const userId = req.user?.id;
      if (!this.isValidMongoId(userId as string)) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Invalid user id",
        });
      }
      await this.validateUser(userId as string);
      await this.validateBranch(dto.branchId);
      await this.validateVendor(dto.vendorId);

      const billDate: Date = new Date(dto.billDate);
      const dueDate: Date = new Date(dto.dueDate);

      if (dueDate < billDate) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Due date must be greater than bill date",
        });
      }

      const items: IItem[] = this.mapItems(dto.items);

      await this.purchaseOrderService.genericFindOneByIdOrNotFound(
        dto.purchaseOrderNumber
      );

      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const payload: Partial<IBillingRecords> = {
        ...dto,
        createdBy: new Types.ObjectId(userId),
        items: items,
        isDeleted: false,
        vendorId: new Types.ObjectId(dto.vendorId),
        purchaseOrderNumber: new Types.ObjectId(dto.purchaseOrderNumber),
        branchId: new Types.ObjectId(dto.branchId),
        billDate: new Date(dto.billDate),
        dueDate: new Date(dto.dueDate),
      };

      const data = await this.genericCreateOne(payload);

      return res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: "Billing record created successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  private async validateUser(id: string) {
    const user = await this.userModel.findOne({
      _id: id,
      isDeleted: false,
    });
    if (!user) throw new Error("User not found");
    return user;
  }

  private async validateBranch(id: string) {
    const branch = await this.branchModel.findOne({
      _id: id,
      isDeleted: false,
    });
    if (!branch) throw new Error("Branch not found");
    return branch;
  }

  private async validateVendor(id: string) {
    const vendor = await this.vendorModel.findOne({
      _id: id,
      isDeleted: false,
    });
    if (!vendor) throw new Error("Vendor not found");
    return vendor;
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

export default new BillingRecordsController(
  BillingSchemaModel,
  vendorModel,
  userModel,
  branchModel
);
