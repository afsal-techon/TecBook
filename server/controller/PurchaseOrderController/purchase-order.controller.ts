import { NextFunction, Request, Response } from "express";
import { Types, Model } from "mongoose";
import { GenericDatabaseService } from "../../Helper/GenericDatabase";
import { PurchaseOrderModel } from "../../models/purchaseOrderModel";
import { CreatePurchaseOrderDto } from "../../dto/create-purchase-order.dto";
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
  )  => {
    try {
      const dto: CreatePurchaseOrderDto = req.body;
      const userId: string | undefined = req.user?.id;

      console.log('userid', userId)

      const quoteDate: Date = new Date(dto.quoteDate);
      const expiryDate: Date = new Date(dto.expiryDate);

      if (expiryDate <= quoteDate) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Expiry date must be greater than quote date",
        });
        return;
      }

      const validVendor = await this.vendorModel.findOne({
        _id: dto.vendorId,
        isDeleted: false,
      });

      if (!validVendor) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Vendor not found",
        });
        return;
      }

      const validUser = await this.userModel.findOne({
        _id: dto.salesmanId,
        isDeleted: false,
      });

      if (!validUser) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Salesman not found",
        });
        return;
      }

      if (dto.projectId) {
        const validProject = await this.projectModel.findOne({
          _id: dto.projectId,
          isDeleted: false,
        });

        if (!validProject) {
          res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            message: "Project not found",
          });
          return;
        }
      }


      const items: IItem[] = dto.items.map((item: ItemDto) => ({
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
}

export default new PurchaseOrderController(
  vendorModel,
  userModel,
  projectModel
);
