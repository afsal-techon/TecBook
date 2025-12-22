import { NextFunction, Request, Response } from "express";
import mongoose, { Types, Model } from "mongoose";
import { GenericDatabaseService } from "../../Helper/GenericDatabase";
import { PurchaseOrderModel } from "../../models/purchaseOrderModel";
import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
} from "../../dto/create-purchase-order.dto";
import vendorModel from "../../models/vendor";
import userModel from "../../models/user";
import projectModel from "../../models/project";
import { IVendor, IProject, IBranch } from "../../types/common.types";
import { IUser } from "../../types/user.types";
import { HTTP_STATUS } from "../../constants/http-status";
import { IPurchaseOrder } from "../../Interfaces/purchase-order.interface";
import { IItem } from "../../Interfaces/item.interface";
import { ItemDto } from "../../dto/item.dto";
import branchModel from "../../models/branch";
import { resolveUserAndAllowedBranchIds } from "../../Helper/branch-access.helper";

class PurchaseOrderController extends GenericDatabaseService<IPurchaseOrder> {
  private readonly vendorModel: Model<IVendor>;
  private readonly userModel: Model<IUser>;
  private readonly projectModel: Model<IProject>;
  private readonly branchModel: Model<IBranch>;

  constructor(
    vendorModel: Model<IVendor>,
    userModel: Model<IUser>,
    projectModel: Model<IProject>,
    branchModel: Model<IBranch>
  ) {
    super(PurchaseOrderModel);

    this.vendorModel = vendorModel;
    this.userModel = userModel;
    this.projectModel = projectModel;
    this.branchModel = branchModel;
  }

  createPurchaseOrder = async (
    req: Request<{}, {}, CreatePurchaseOrderDto>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const dto: CreatePurchaseOrderDto = req.body;
      const userId: string | undefined = req.user?.id;


      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const quoteDate: Date = new Date(dto.quoteDate);
      const expiryDate: Date = new Date(dto.expiryDate);

      if (expiryDate <= quoteDate) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Expiry date must be greater than quote date",
        });
      }

      await this.validateVendor(dto.vendorId);
      await this.validateSalesman(dto.salesmanId);
      if (dto.projectId) await this.validateProject(dto.projectId);

      const items: IItem[] = this.mapItems(dto.items);

      const payload: Partial<IPurchaseOrder> = {
        vendorId: new Types.ObjectId(dto.vendorId),
        purchaseOrderNumber: 5, //TODO : move to auto increment
        quoteNumber: dto.quoteNumber,
        quoteDate,
        expiryDate,
        salesmanId: new Types.ObjectId(dto.salesmanId),
        projectId: dto.projectId
          ? new Types.ObjectId(dto.projectId)
          : undefined,
        items,
        createdBy: new Types.ObjectId(userId) ?? undefined,
        branchId: new Types.ObjectId(dto.branchId),
      };

      const purchaseOrder = await this.createOne(payload);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: "Purchase order created successfully",
        data: purchaseOrder,
      });
    } catch (error) {
      next(error);
    }
  };

  updatePurchaseOrder = async (
    req: Request<{ id: string }, {}, UpdatePurchaseOrderDto>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!this.isValidMongoId(req.params.id)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Invalid purchase order id",
        });
      }

      return this.genericUpdateOneById(req, res, next);
    } catch (error) {
      next(error);
    }
  };

  getAllPurchaseOrders = async (
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

      const totalCount = await PurchaseOrderModel.countDocuments(query);
      // console.log('count', totalCount)

      const purchaseOrders = await PurchaseOrderModel.find(query)
        .sort({ createdAt: -1 })
        .populate("vendorId")
        .populate({
          path: "salesmanId",
          select: "username email",
        })
        .populate("projectId")
        .skip(skip)
        .limit(limit);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: purchaseOrders,
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
    }
  };

  getPurchaseOrderById = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;

      if (!this.isValidMongoId(id)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Invalid purchase order id",
        });
      }

      const purchaseOrder = await PurchaseOrderModel.findOne({
        _id: id,
        isDeleted: false,
      })
        .populate("vendorId")
        .populate({
          path: "salesmanId",
          select: "username email",
        })
        .populate("projectId");

      if (!purchaseOrder) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Purchase order not found",
        });
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: purchaseOrder,
      });
    } catch (error) {
      next(error);
    }
  };

  private async validateVendor(vendorId: string) {
    const vendor = await this.vendorModel.findOne({
      _id: vendorId,
      isDeleted: false,
    });
    if (!vendor) throw new Error("Vendor not found");
  }

  private async validateSalesman(userId: string) {
    const user = await this.userModel.findOne({
      _id: userId,
      isDeleted: false,
    });
    if (!user) throw new Error("Salesman not found");
    return user;
  }

  private async validateProject(projectId: string) {
    const project = await this.projectModel.findOne({
      _id: projectId,
      isDeleted: false,
    });
    if (!project) throw new Error("Project not found");
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
export default new PurchaseOrderController(
  vendorModel,
  userModel,
  projectModel,
  branchModel
);
