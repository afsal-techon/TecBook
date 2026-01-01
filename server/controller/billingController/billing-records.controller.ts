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
import { IBranch, IPaymentTerms, IVendor } from "../../types/common.types";
import { IUser } from "../../types/user.types";
import userModel from "../../models/user";
import purchaseOrderController from "../PurchaseOrderController/purchase-order.controller";
import { ItemDto } from "../../dto/item.dto";
import { IItem } from "../../Interfaces/item.interface";
import { resolveUserAndAllowedBranchIds } from "../../Helper/branch-access.helper";
import { PurchaseOrderModelConstants } from "../../models/purchaseOrderModel";
import { imagekit } from "../../config/imageKit";
import numberSettingModel from "../../models/numberSetting";
import { numberSettingsDocumentType } from "../../types/enum.types";
import { generateDocumentNumber } from "../../Helper/generateDocumentNumber";
import paymentTermModel from "../../models/paymentTerms";

class BillingRecordsController extends GenericDatabaseService<
  Model<IBillingRecords>
> {
  private readonly vendorModel: Model<IVendor>;
  private readonly userModel: Model<IUser>;
  private readonly branchModel: Model<IBranch>;
  private readonly paymentTermModel: Model<IPaymentTerms>;
  constructor(
    dbModel: Model<IBillingRecords>,
    vendorModel: Model<IVendor>,
    userModel: Model<IUser>,
    branchModel: Model<IBranch>,
    private readonly purchaseOrderService = purchaseOrderController,
    paymentTermModel: Model<IPaymentTerms>
  ) {
    super(dbModel);
    this.vendorModel = vendorModel;
    this.userModel = userModel;
    this.branchModel = branchModel;
    this.paymentTermModel = paymentTermModel;
  }

  /**
   * Creates a new billing record.
   *
   * This handler performs comprehensive validation and creation logic:
   * - Verifies the authenticated user's ID.
   * - Validates the existence of the specified Branch and Vendor.
   * - Enforces that the `dueDate` is greater than or equal to the `billDate`.
   * - Maps item DTOs to the required schema format.
   * - Verifies the existence of the linked Purchase Order.
   * - Creates the billing record with the provided data and calculated fields.
   *
   * @param req - The Express Request object. Expects `CreateBillingRecordsDTO` in `req.body` and an authenticated user in `req.user`.
   * @param res - The Express Response object.
   * @param next - The Express NextFunction for error handling.
   * @returns A Promise resolving to the HTTP response (201 Created) containing the newly created billing record.
   */
  createBillingRecords = async (
    req: Request<{}, {}, CreateBillingRecordsDTO>,
    res: Response
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
      await this.valiatePaymentTerms(dto.paymentTermsId);

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

      const numberSetting = await numberSettingModel.findOne({
        branchId: new Types.ObjectId(dto.branchId),
        docType: numberSettingsDocumentType.BILL,
      });

      if (!numberSetting)
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message:
            "Number setting is not configured. Please configure it first.",
        });

      const billNumber = await generateDocumentNumber({
        branchId: dto.branchId,
        manualId: numberSetting?.mode !== "Auto" ? dto.billNumber : undefined,
        docType: numberSettingsDocumentType.PURCHASE_ORDER,
        Model: BillingSchemaModel,
        idField: BillingSchemaModelConstants.billNumber,
      });

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
        documents: uploadedFiles,
        billNumber,
        paymentTermsId: dto.paymentTermsId
          ? new Types.ObjectId(dto.paymentTermsId)
          : undefined,
      };

      const data = await this.genericCreateOne(payload);

      return res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: "Billing record created successfully",
        data,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log("Error while creating billing record", error.message);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: error.message,
        });
      }
      console.log("Error while creating billing record", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error while creating billing record",
      });
    }
  };

  /**
   * Updates an existing billing record.
   * @description This method handles the update of an existing billing record. It performs several validation checks:
   * - Validates the provided billing record ID.
   * - Ensures that the `dueDate` is not earlier than the `billDate`.
   * - Validates the existence of the specified vendor, branch, and purchase order (if provided).
   * It then constructs and updates the billing record document in the database.
   * @param req The Express request object, containing the billing record ID in `req.params.id` and the `updateBillingRecordsDTO` in the body.
   * @param res The Express response object used to send back the result.
   * @param next The Express next function to pass control to the next middleware.
   */
  updateBillingRecords = async (
    req: Request<{ id: string }, {}, updateBillingRecordsDTO>,
    res: Response
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
      if (dto.paymentTermsId)
        await this.valiatePaymentTerms(dto.paymentTermsId);

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
        documents: dto.existingDocuments ?? [],
      };

      await this.genericUpdateOneById(id, payload);

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Billing record updated successfully",
        statusCode: HTTP_STATUS.OK,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log("Error while updating billing record", error.message);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: error.message,
        });
      }
      console.log("Error while updating billing record", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to update billing record",
      });
    }
  };

  /**
   * Retrieves all billing records.
   * @description This method retrieves all billing records from the database, with optional filtering by branch ID and search functionality.
   * It also handles pagination and populates related fields like vendor, salesman, and project.
   * @param req The Express request object, which may contain `limit`, `page`, `search`, and `branchId` as query parameters.
   * @param res The Express response object used to send back the result.
   * @param next The Express next function to pass control to the next middleware.
   */
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
          select: `${PurchaseOrderModelConstants.purchaseOrderId}`,
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

  /**
   * Retrieves a single billing record by ID.
   * @description This method retrieves a single billing record by its ID from the database.
   * It first validates the billing record ID, then fetches the billing record along with its related vendor, salesman, and project details.
   * @param req The Express request object, which contains the billing record ID in `req.params.id`.
   * @param res The Express response object used to send back the result.
   * @param next The Express next function to pass control to the next middleware.
   */
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
          select: `${PurchaseOrderModelConstants.purchaseOrderId}`,
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

  /**
   * Deletes a billing record by ID.
   * @description This method deletes a billing record by its ID from the database.
   * It first validates the billing record ID, then updates the record to mark it as deleted.
   * @param req The Express request object, containing the billing record ID in `req.params.id`.
   * @param res The Express response object used to send back the result.
   * @returns A Promise that resolves to void. Sends a JSON response with HTTP 200 (OK) on successful deletion.
   * @throws {Error} Throws an error if the database operation fails.
   */

  deleteBillingRecordById = async (
    req: Request<{ id: string }>,
    res: Response
  ) => {
    try {
      const { id } = req.params;
      const result = await this.genericDeleteOneById(id);
      return res.status(result.statusCode).json({
        success: result.success,
        message: result.message,
        statusCode: result.statusCode,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Failed to delete billing record", error.message);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: error.message,
        });
      }
      console.log("Failed to delete billing record", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to delete billing record",
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      });
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

  private readonly valiatePaymentTerms = async (id: string) => {
    if (!this.isValidMongoId(id)) throw new Error("Invalid payment terms id");
    const paymentTerms = await this.paymentTermModel.findOne({
      _id: id,
      isDeleted: false,
    });
    if (!paymentTerms) throw new Error("Payment terms not found");
    return paymentTerms;
  };

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

export default new BillingRecordsController(
  BillingSchemaModel,
  vendorModel,
  userModel,
  branchModel,
  purchaseOrderController,
  paymentTermModel
);
