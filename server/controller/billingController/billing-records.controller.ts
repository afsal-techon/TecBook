import { Request, Response, NextFunction } from "express";
import mongoose, { Model, Types } from "mongoose";
import { GenericDatabaseService } from "../../Helper/GenericDatabase";
import { IBillingRecords } from "../../Interfaces/billing-records.interface";
import {
  BillingSchemaModel,
  BillingSchemaModelConstants,
} from "../../models/BillingRecordsModel";
import {
  CreateBillingRecordsDTO,
  updateBillingRecordsDTO,
} from "../../dto/billing-records.dto";
import { HTTP_STATUS } from "../../constants/http-status";
import vendorModel from "../../models/vendor";
import branchModel from "../../models/branch";
import { IBranch, IVendor } from "../../types/common.types";
import { IUser } from "../../types/user.types";
import userModel from "../../models/user";
import purchaseOrderController from "../PurchaseOrderController/purchase-order.controller";
import { ItemDto } from "../../dto/item.dto";
import { IItem } from "../../Interfaces/item.interface";
import { resolveUserAndAllowedBranchIds } from "../../Helper/branch-access.helper";
import { PurchaseOrderModelConstants } from "../../models/purchaseOrderModel";

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
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
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
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
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
  updateBillingRecords = async (
    req: Request<{ id: string }, {}, updateBillingRecordsDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const id = req.params.id;

      if (!this.isValidMongoId(id)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Invalid billing record id",
        });
      }

      const dto: updateBillingRecordsDTO = req.body;

      let billDate: Date | undefined;
      let dueDate: Date | undefined;

      if (dto.billDate) {
        billDate = new Date(dto.billDate);
      }

      if (dto.dueDate) {
        dueDate = new Date(dto.dueDate);
      }

      if (billDate && dueDate && dueDate < billDate) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Due date must be greater than bill date",
        });
      }

      if (dto.vendorId) {
        await this.validateVendor(dto.vendorId);
      }

      if (dto.branchId) {
        await this.validateBranch(dto.branchId);
      }

      if (dto.purchaseOrderNumber) {
        await this.purchaseOrderService.genericFindOneByIdOrNotFound(
          dto.purchaseOrderNumber
        );
      }

      const items: IItem[] = dto.items ? this.mapItems(dto.items) : [];

      const payload: Partial<IBillingRecords> = {
        vendorId: dto.vendorId ? new Types.ObjectId(dto.vendorId) : undefined,

        branchId: dto.branchId ? new Types.ObjectId(dto.branchId) : undefined,

        purchaseOrderNumber: dto.purchaseOrderNumber
          ? new Types.ObjectId(dto.purchaseOrderNumber)
          : undefined,

        billDate,
        dueDate,

        items,
      };

      await this.genericUpdateOneById(id, payload);

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Billing record updated successfully",
        statusCode: HTTP_STATUS.OK,
      });
    } catch (error) {
      next(error);
    }
  };

  getAllBillingRecords = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const authUser = req.user as { id: string };

      const limit = parseInt(req.query.limit as string) || 20;
      const page = parseInt(req.query.page as string) || 1;
      const skip = (page - 1) * limit;
      const search = (req.query.search as string) || "";
      const filterBranchId = req.query.branchId as string | undefined;

      const { user, allowedBranchIds } = await resolveUserAndAllowedBranchIds({
        userId: authUser.id,
        userModel: this.userModel,
        branchModel: this.branchModel,
        requestedBranchId: filterBranchId,
      });

      // console.log("allowedBranchIds", allowedBranchIds);

      const query: any = {
        isDeleted: false,
        branchId: { $in: allowedBranchIds },
      };

      if (search) {
        query.quoteNumber = { $regex: search, $options: "i" };
      }

      const totalCount = await BillingSchemaModel.countDocuments(query);
      // console.log('count', totalCount)

      const billingRecords = await BillingSchemaModel.find(query)
        .sort({ createdAt: -1 })
        .populate(BillingSchemaModelConstants.vendorId)
        .populate({
          path: BillingSchemaModelConstants.purchaseOrderNumber,
          select: `${PurchaseOrderModelConstants.purchaseOrderNumber}`,
        })
        .populate(BillingSchemaModelConstants.branchId)
        .skip(skip)
        .limit(limit);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: billingRecords,
        pagination: {
          totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
        },
      });
    } catch (error: any) {
      res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
      next(error);
    }
  };

  getBillingRecordById = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;

      if (!this.isValidMongoId(id)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Invalid Billing record order id",
        });
      }

      const billingRecord = await BillingSchemaModel.findOne({
        _id: id,
        isDeleted: false,
      })
        .populate(BillingSchemaModelConstants.vendorId)
        .populate({
          path: BillingSchemaModelConstants.purchaseOrderNumber,
          select: `${PurchaseOrderModelConstants.purchaseOrderNumber}`,
        })
        .populate(BillingSchemaModelConstants.branchId);

      if (!billingRecord) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Billing record not found",
        });
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: billingRecord,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log("Error while fetching Billing Record", error.message);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: error.message,
        });
      }
      console.log("Error while fetching Billing Record", error);
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
