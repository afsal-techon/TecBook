import { NextFunction, Request, Response } from "express";
import { Types, Model } from "mongoose";
import { GenericDatabaseService } from "../../Helper/GenericDatabase";
import { PurchaseOrderModel } from "../../models/purchaseOrderModel";
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from "../../dto/create-purchase-order.dto";
import vendorModel from "../../models/vendor";
import userModel from "../../models/user";
import projectModel from "../../models/project";
import { IVendor, IProject } from "../../types/common.types";
import { IUser } from "../../types/user.types";
import { HTTP_STATUS } from "../../constants/http-status";
import { IPurchaseOrder } from "../../Interfaces/purchase-order.interface";
import { IItem } from "../../Interfaces/item.interface";
import { ItemDto } from "../../dto/item.dto";

class PurchaseOrderController extends GenericDatabaseService<IPurchaseOrder> {
  private readonly vendorModel: Model<IVendor>;
  private readonly userModel: Model<IUser>;
  private readonly projectModel: Model<IProject>;

  constructor(
    vendorModel: Model<IVendor>,
    userModel: Model<IUser>,
    projectModel: Model<IProject>
  ) {
    super(PurchaseOrderModel);

    this.vendorModel = vendorModel;
    this.userModel = userModel;
    this.projectModel = projectModel;
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
        purchaseOrderNumber: 1,  //TODO : move to auto increment
        quoteNumber: dto.quoteNumber,
        quoteDate,
        expiryDate,
        salesmanId: new Types.ObjectId(dto.salesmanId),
        projectId: dto.projectId
          ? new Types.ObjectId(dto.projectId)
          : undefined,
        items,
        createdBy: new Types.ObjectId(userId) ?? undefined,
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


  deletePurchaseOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    return this.genericDeleteOneById(req, res, next);
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
  projectModel
);
