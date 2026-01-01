import { NextFunction, Request, Response } from "express";
import mongoose, { Types, Model } from "mongoose";
import { GenericDatabaseService } from "../../Helper/GenericDatabase";
import {
  PurchaseOrderModel,
  PurchaseOrderModelConstants,
  PurchaseOrderModelDocument,
} from "../../models/purchaseOrderModel";
import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
} from "../../dto/create-purchase-order.dto";
import vendorModel from "../../models/vendor";
import userModel from "../../models/user";
import projectModel from "../../models/project";
import {
  IVendor,
  IProject,
  IBranch,
  ISalesPerson,
  IPaymentTerms,
} from "../../types/common.types";
import { IUser } from "../../types/user.types";
import { HTTP_STATUS } from "../../constants/http-status";
import { IPurchaseOrder } from "../../Interfaces/purchase-order.interface";
import { IItem } from "../../Interfaces/item.interface";
import { ItemDto } from "../../dto/item.dto";
import branchModel from "../../models/branch";
import { resolveUserAndAllowedBranchIds } from "../../Helper/branch-access.helper";
import { imagekit } from "../../config/imageKit";
import salesPersonModel from "../../models/salesPerson";
import paymentTermModel from "../../models/paymentTerms";
import { stat } from "fs";

class PurchaseOrderController extends GenericDatabaseService<PurchaseOrderModelDocument> {
  private readonly vendorModel: Model<IVendor>;
  private readonly userModel: Model<IUser>;
  private readonly projectModel: Model<IProject>;
  private readonly branchModel: Model<IBranch>;
  private readonly salesModel: Model<ISalesPerson>;
  private readonly paymentTermsModel: Model<IPaymentTerms>;

  constructor(
    vendorModel: Model<IVendor>,
    userModel: Model<IUser>,
    projectModel: Model<IProject>,
    branchModel: Model<IBranch>,
    salesModel: Model<ISalesPerson>,
    paymentTermsModel: Model<IPaymentTerms>
  ) {
    super(PurchaseOrderModel);

    this.vendorModel = vendorModel;
    this.userModel = userModel;
    this.projectModel = projectModel;
    this.branchModel = branchModel;
    this.salesModel = salesPersonModel;
    this.paymentTermsModel = paymentTermsModel;
  }

  /**
   * @summary Creates a new purchase order.
   * @description This method handles the creation of a new purchase order. It performs several validation checks:
   * - Ensures a user is authenticated.
   * - Validates that the expiry date is later than the quote date.
   * - Confirms the existence of the specified vendor, salesman, and project (if applicable).
   * It then constructs and saves a new purchase order document to the database.
   * @param req The Express request object, containing the `CreatePurchaseOrderDto` in the body.
   * @param res The Express response object used to send back the result.
   * @param next The Express next function to pass control to the next middleware.
   */
  createPurchaseOrder = async (
    req: Request<{}, {}, CreatePurchaseOrderDto>,
    res: Response
  ) => {
    try {
      const dto: CreatePurchaseOrderDto = req.body;
      console.log(dto, "dto");
      console.log(req.body, "req.body");
      const userId: string | undefined = req.user?.id;

      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const existingPurchaseNumberCheck = await this.genericFindOne({
        purchaseOrderId: dto.purchaseOrderId,
      });
      if (existingPurchaseNumberCheck) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Purchase order ID already exists",
        });
      }

      const quoteDate: Date = new Date(dto.purchaseOrderDate);
      const expiryDate: Date = new Date(dto.expDate);

      if (expiryDate < quoteDate) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Expiry date must be greater than quote date",
        });
      }

      await this.validateVendor(dto.vendorId);
      await this.validateSalesman(dto.salesPersonId);
      if (dto.projectId) await this.validateProject(dto.projectId);
      if (dto.paymentTermsId)
        await this.validatePaymenetTerms(dto.paymentTermsId);

      const uploadedFiles: string[] = [];
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          const uploadResponse = await imagekit.upload({
            file: file.buffer.toString("base64"),
            fileName: file.originalname,
            folder: "/images",
          });
          uploadedFiles.push(uploadResponse.url);
        }
      }

      const items: IItem[] = this.mapItems(dto.items);

      const payload: Partial<IPurchaseOrder> = {
        ...dto,
        vendorId: new Types.ObjectId(dto.vendorId),
        purchaseOrderId: dto.purchaseOrderId,
        quote: dto.quote,
        purchaseOrderDate: quoteDate,
        expDate: expiryDate,
        salesPersonId: new Types.ObjectId(dto.salesPersonId),
        projectId: dto.projectId
          ? new Types.ObjectId(dto.projectId)
          : undefined,
        items,
        createdBy: new Types.ObjectId(userId) ?? undefined,
        branchId: new Types.ObjectId(dto.branchId),
        documents: uploadedFiles,
        paymentTermsId: dto.paymentTermsId
          ? new Types.ObjectId(dto.paymentTermsId)
          : undefined,
      };

      const purchaseOrder = await this.genericCreateOne(payload);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: "Purchase order created successfully",
        data: purchaseOrder,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Failed to create purchase order", error.message);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: error.message,
        });
      }
      console.log("Failed to create purchase order", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to create purchase order",
      });
    }
  };

  /**
   * @summary Updates an existing purchase order.
   * @description This method handles the update of an existing purchase order. It first validates the provided purchase order ID.
   * It then validates the associated vendor, salesman, and project (if provided) to ensure their existence. Finally, it updates the purchase order in the database with the new data.
   * @param req The Express request object, containing the purchase order ID in `req.params.id` and the `UpdatePurchaseOrderDto` in the body.
   * @param res The Express response object used to send back the result.
   * @param next The Express next function to pass control to the next middleware.
   */

  updatePurchaseOrder = async (
    req: Request<{ id: string }, {}, UpdatePurchaseOrderDto>,
    res: Response
  ) => {
    try {
      const id: string = req.params.id;
      const dto: UpdatePurchaseOrderDto = req.body;

      console.log(dto, "dto");
      console.log(req.body, "req.body");

      if (!this.isValidMongoId(req.params.id)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Invalid purchase order id",
        });
      }

      const existingData = await this.genericFindById(id);

      let quoteDate: Date | undefined;
      let expiryDate: Date | undefined;

      if (req.body.purchaseOrderDate) {
        quoteDate = new Date(req.body.purchaseOrderDate);
      }

      if (req.body.expDate) {
        expiryDate = new Date(req.body.expDate);
      }

      if (expiryDate && quoteDate && expiryDate <= quoteDate) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Expiry date must be greater than quote date",
        });
      }

      if (req.body.vendorId) {
        await this.validateVendor(req.body.vendorId);
      }
      if (req.body.salesPersonId) {
        await this.validateSalesman(req.body.salesPersonId);
      }
      if (req.body.projectId) {
        await this.validateProject(req.body.projectId);
      }
      if (dto.paymentTermsId) {
        await this.validatePaymenetTerms(dto.paymentTermsId);
      }

      const items: IItem[] = this.mapItems(req.body.items || []);
      const payload: Partial<IPurchaseOrder> = {
        ...dto,
        purchaseOrderId: dto.purchaseOrderId ? dto.purchaseOrderId : undefined,
        vendorId: req.body.vendorId
          ? new Types.ObjectId(req.body.vendorId)
          : undefined,
        quote: req.body.quote,
        purchaseOrderDate: quoteDate,
        expDate: expiryDate,
        salesPersonId: req.body.salesPersonId
          ? new Types.ObjectId(req.body.salesPersonId)
          : undefined,
        projectId: req.body.projectId
          ? new Types.ObjectId(req.body.projectId)
          : undefined,
        items,
        branchId: dto.branchId ? new Types.ObjectId(dto.branchId) : undefined,
        paymentTermsId: req.body.paymentTermsId
          ? new Types.ObjectId(req.body.paymentTermsId)
          : undefined,
      };

      await this.genericUpdateOneById(id, payload);

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Purchase order updated successfully",
        statusCode: HTTP_STATUS.OK,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log("Failed to update purchase order", error.message);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: error.message,
        });
      }
      console.log("Failed to update purchase order", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to update purchase order",
      });
    }
  };

  /**
   * @summary Retrieves all purchase orders.
   * @description This method retrieves all purchase orders from the database, with optional filtering by branch ID and search functionality.
   * It also handles pagination and populates related fields like vendor, salesman, and project.
   * @param req The Express request object, which may contain `limit`, `page`, `search`, and `branchId` as query parameters.
   * @param res The Express response object used to send back the result.
   * @param next The Express next function to pass control to the next middleware.
   */
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

      const { allowedBranchIds } = await resolveUserAndAllowedBranchIds({
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
        .populate(PurchaseOrderModelConstants.vendorId)
        .populate({
          path: PurchaseOrderModelConstants.salesPersonId,
          select: "name email",
        })
        .populate(PurchaseOrderModelConstants.projectId)
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
      next(error);
    }
  };

  /**
   * @summary Retrieves a single purchase order by ID.
   * @description This method retrieves a single purchase order by its ID from the database.
   * It first validates the purchase order ID, then fetches the purchase order along with its related vendor, salesman, and project details.
   * @param req The Express request object, containing the purchase order ID in `req.params.id`.
   * @param res The Express response object used to send back the result.
   * @param next The Express next function to pass control to the next middleware.
   */
  getPurchaseOrderById = async (
    req: Request<{ id: string }>,
    res: Response
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
        .populate(PurchaseOrderModelConstants.vendorId)
        .populate({
          path: PurchaseOrderModelConstants.salesPersonId,
          select: "username email",
        })
        .populate(PurchaseOrderModelConstants.projectId)
        .populate({
          path: PurchaseOrderModelConstants.branchId,
          select: "branchName city email phone",
        });

      if (!purchaseOrder) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Purchase order not found",
        });
      }

      let paymentTerm: any = null;

      if (
        purchaseOrder.paymentTermsId &&
        mongoose.Types.ObjectId.isValid(purchaseOrder.paymentTermsId.toString())
      ) {
        const paymentTermsDoc = await this.paymentTermsModel.findOne(
          {
            "terms._id": purchaseOrder.paymentTermsId,
          },
          {
            "terms.$": 1,
          }
        );

        paymentTerm = paymentTermsDoc?.terms?.[0] || null;
      }

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          ...purchaseOrder.toObject(),
          paymentTerm,
        },
      });
    } catch (error: unknown) {
      console.error("Failed to get purchase order", error);

      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to get purchase order",
      });
    }
  };

  /*  @summary Deletes a purchase order by ID.
   * @description This method deletes a purchase order by its ID from the database.
   * It first validates the purchase order ID, then updates the record to mark it as deleted.
   * @param req The Express request object, containing the purchase order ID in `req.params.id`.
   * @param res The Express response object used to send back the result.
   * @param next The Express next function to pass control to the next middleware.
   */
  deletePurchaseOrder = async (req: Request<{ id: string }>, res: Response) => {
    try {
      const { id } = req.params;
      const result = await this.genericDeleteOneById(id);
      return res.status(result.statusCode).json({
        success: result.success,
        message: result.message,
        statusCode: HTTP_STATUS.NO_CONTENT,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Failed to delete purchase order", error.message);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: error.message,
        });
      }
      console.log("Failed to delete purchase order", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to delete purchase order",
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      });
    }
  };

  // Helper methods for validations
  private async validateVendor(vendorId: string) {
    const vendor = await this.vendorModel.findOne({
      _id: vendorId,
      isDeleted: false,
    });
    if (!vendor) throw new Error("Vendor not found");
  }

  private async validateSalesman(id: string) {
    const user = await this.salesModel.findOne({
      _id: id,
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

  private async validatePaymenetTerms(paymentTermsId: string) {
    if (!this.isValidMongoId(paymentTermsId))
      throw new Error("Invalid payment terms id");
    const paymentTerms = await this.paymentTermsModel.findOne({
      "terms._id": new mongoose.Types.ObjectId(paymentTermsId),
    });
    if (!paymentTerms) throw new Error("Payment terms not found");
  }

  private mapItems(itemsDto: ItemDto[]): IItem[] {
    return itemsDto.map((item) => ({
      itemId: new Types.ObjectId(item.itemId),
      taxId: new Types.ObjectId(item.taxId),

      prevItemId: item.prevItemId
        ? new Types.ObjectId(item.prevItemId)
        : undefined,

      itemName: item.itemName,
      qty: item.qty,
      rate: item.rate,
      amount: item.amount,
      unit: item.unit,
      discount: item.discount,
      customerId: item.customerId
        ? new Types.ObjectId(item.customerId)
        : undefined,
      accountId: item.accountId
        ? new Types.ObjectId(item.accountId)
        : undefined,
    }));
  }
}
export default new PurchaseOrderController(
  vendorModel,
  userModel,
  projectModel,
  branchModel,
  salesPersonModel,
  paymentTermModel
);
