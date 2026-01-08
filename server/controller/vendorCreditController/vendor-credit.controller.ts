import mongoose, { Model, Types } from "mongoose";
import { ItemDto } from "../../dto/item.dto";
import { GenericDatabaseService } from "../../Helper/GenericDatabase";
import {
  vendorCreditModel,
  vendorCreditModelConstants,
  vendorCreditModelDocument,
} from "../../models/vendor-credit.model";
import { IItem } from "../../Interfaces/item.interface";
import itemModel from "../../models/items";
import taxModel from "../../models/tax";
import accountModel from "../../models/accounts";
import customerModel from "../../models/customer";
import { Request, Response } from "express";
import {
  applyVendorCreditToBillDto,
  CreateVendorCreditDto,
  UpdateVendorCreditDto,
  vendorCreditToBillDto,
} from "../../dto/vendor-credit.dto";
import { IVendorCredit } from "../../Interfaces/vendor-credit.interface";
import { HTTP_STATUS } from "../../constants/http-status";
import { IBranch, IVendor } from "../../types/common.types";
import branchModel from "../../models/branch";
import vendorModel from "../../models/vendor";
import { resolveUserAndAllowedBranchIds } from "../../Helper/branch-access.helper";
import { IUser } from "../../types/user.types";
import userModel from "../../models/user";
import numberSettingModel from "../../models/numberSetting";
import {
  BillingRecordsStatus,
  commonStatus,
  numberSettingsDocumentType,
} from "../../types/enum.types";
import { generateDocumentNumber } from "../../Helper/generateDocumentNumber";
import { imagekit } from "../../config/imageKit";
import billingRecordsController from "../billingController/billing-records.controller";
import { BillingSchemaModel } from "../../models/BillingRecordsModel";

class vendorCredit extends GenericDatabaseService<vendorCreditModelDocument> {
  private readonly branchModel: Model<IBranch>;
  private readonly vendorModel: Model<IVendor>;
  private readonly userModel: Model<IUser>;
  private readonly billingService = billingRecordsController;

  constructor(
    branchModel: Model<IBranch>,
    vendorModel: Model<IVendor>,
    userModel: Model<IUser>
  ) {
    super(vendorCreditModel);
    this.branchModel = branchModel;
    this.vendorModel = vendorModel;
    this.userModel = userModel;
  }

  /**
   * Creates a new vendor credit.
   * @description This method handles the creation of a new vendor credit. It performs several validation checks:
   * - Ensures a user is authenticated.
   * - Validates the existence of the specified branch and vendor.
   * - Validates the existence of item references (item, tax, account, customer).
   * - Maps item DTOs to the required schema format.
   * It then constructs and saves a new vendor credit document to the database.
   * @param req The Express request object, containing the `CreateVendorCreditDto` in the body.
   * @param res The Express response object used to send back the result.
   */
  createVendorCredit = async (
    req: Request<{}, {}, CreateVendorCreditDto>,
    res: Response
  ) => {
    try {
      const dto: CreateVendorCreditDto = req.body;

      await this.validateBranch(dto.branchId);
      await this.validateVendor(dto.vendorId);
      await this.validateItemReferences(dto.items);

      const numberSetting = await numberSettingModel.findOne({
        branchId: new Types.ObjectId(dto.branchId),
        docType: numberSettingsDocumentType.VENDOR_CREDIT,
      });

      if (!numberSetting) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message:
            "Number setting is not configured. Please configure it first.",
        });
      }

      const vendorCreditNoteNumber = await generateDocumentNumber({
        branchId: dto.branchId,
        manualId:
          numberSetting.mode !== "Auto"
            ? dto.vendorCreditNoteNumber
            : undefined,
        docType: numberSettingsDocumentType.VENDOR_CREDIT,
        Model: vendorCreditModel,
        idField: vendorCreditModelConstants.vendorCreditNoteNumber,
      });
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
      const payload: Partial<IVendorCredit> = {
        ...dto,
        vendorId: new Types.ObjectId(dto.vendorId),
        branchId: new Types.ObjectId(dto.branchId),
        date: new Date(dto.date),
        items: this.mapItems(dto.items),
        status: dto.status,
        createdBy: new Types.ObjectId(req.user?.id),
        isDeleted: false,
        balanceAmount: dto.total,
        vendorCreditNoteNumber,
        documents: uploadedFiles,
      };

      await this.genericCreateOne(payload);

      return res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: "Vendor credit created successfully",
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log("Failed to create vendor credit", error.message);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: error.message,
        });
      }
      console.log("Failed to create vendor credit", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to create vendor credit",
      });
    }
  };

  updateVendorCredit = async (
    req: Request<{ id: string }, {}, UpdateVendorCreditDto>,
    res: Response
  ) => {
    try {
      const { id } = req.params;
      const dto: UpdateVendorCreditDto = req.body;

      if (!this.isValidMongoId(id)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Invalid vendor credit id",
        });
      }

      await this.genericFindOneByIdOrNotFound(id);

      if (dto.items?.length) {
        await this.validateItemReferences(dto.items);
      }

      let finalDocuments: string[] = [];

      if (dto.existingDocuments) {
        const parsedDocs = Array.isArray(dto.existingDocuments)
          ? dto.existingDocuments
          : JSON.parse(dto.existingDocuments);

        finalDocuments = parsedDocs
          .map((doc: any) => (typeof doc === "string" ? doc : doc.doc_file))
          .filter((d: string) => !!d);
      }

      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          const uploaded = await imagekit.upload({
            file: file.buffer.toString("base64"),
            fileName: file.originalname,
            folder: "/images",
          });
          finalDocuments.push(uploaded.url);
        }
      }

      const payload: Partial<IVendorCredit> = {
        ...dto,
        vendorId: dto.vendorId ? new Types.ObjectId(dto.vendorId) : undefined,
        branchId: dto.branchId ? new Types.ObjectId(dto.branchId) : undefined,
        date: dto.date ? new Date(dto.date) : undefined,
        items: dto.items ? this.mapItems(dto.items) : undefined,
        documents: finalDocuments,
      };

      await this.genericUpdateOneById(id, payload);

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Vendor credit updated successfully",
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log("Failed to update vendor credit", error.message);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: error.message,
        });
      }
      console.log("Failed to update vendor credit", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to update vendor credit",
      });
    }
  };

  /**
   * Deletes a vendor credit by its ID.
   * @param req The Express request object, containing the ID of the vendor credit to delete.
   * @param res The Express response object used to send back the result.
   */
  deleteVendorCredit = async (req: Request<{ id: string }>, res: Response) => {
    try {
      const { id } = req.params;
      await this.genericFindOneByIdOrNotFound(id);
      const result = await this.genericDeleteOneById(id);

      return res.status(result.statusCode).json({
        success: result.success,
        message: result.message,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Failed to delete vendor credit", error.message);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: error.message,
        });
      }
      console.log("Failed to delete vendor credit", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to delete vendor credit",
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      });
    }
  };

  /**
   * Retrieves all vendor credits.
   * @description This method retrieves all vendor credits from the database, with optional filtering by branch ID and search functionality.
   * It also handles pagination and populates related fields like branch and vendor.
   * @param req The Express request object, which may contain `limit`, `page`, `search`, and `branchId` as query parameters.
   * @param res The Express response object used to send back the result.
   */
  getVendorCreditById = async (req: Request<{ id: string }>, res: Response) => {
    try {
      const { id } = req.params;

      if (!this.isValidMongoId(id)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Invalid vendor credit id",
        });
      }

      await this.genericFindOneByIdOrNotFound(id);

      const data = await vendorCreditModel
        .findOne({ _id: id, isDeleted: false })
        .populate({
          path: vendorCreditModelConstants.vendorId,
          select: "_id name",
        })
        .populate(vendorCreditModelConstants.branchId);

      if (!data) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Vendor credit not found",
        });
      }

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        data,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Failed to fetch vendor credit", error.message);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: error.message,
        });
      }
      console.log("Failed to fetch vendor credit", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to fetch vendor credit",
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      });
    }
  };

  /*  Retrieves all vendor credits with optional filtering, search, and pagination.
   * @param req The Express request object, which may contain `limit`, `page`, `search`, and `branchId` as query parameters.
   * @param res The Express response object used to send back the result.
   */
  getAllVendorCredits = async (req: Request, res: Response) => {
    try {
      const authUser = req.user as { id: string };

      const limit = Number(req.query.limit) || 20;
      const page = Number(req.query.page) || 1;
      const skip = (page - 1) * limit;
      const search = (req.query.search as string) || "";
      const filterBranchId = req.query.branchId as string | undefined;

      const { allowedBranchIds } = await resolveUserAndAllowedBranchIds({
        userId: authUser.id,
        userModel: this.userModel,
        branchModel: this.branchModel,
        requestedBranchId: filterBranchId,
      });

      const pipeline: any[] = [
        {
          $match: {
            isDeleted: false,
            branchId: { $in: allowedBranchIds },
          },
        },

        {
          $lookup: {
            from: "vendors",
            localField: "vendorId",
            foreignField: "_id",
            as: "vendor",
          },
        },
        { $unwind: { path: "$vendor", preserveNullAndEmptyArrays: true } },
      ];

      if (search) {
        pipeline.push({
          $match: {
            $or: [
              { vendorCreditNoteNumber: { $regex: search, $options: "i" } },
              { status: { $regex: search, $options: "i" } },
              { "vendor.name": { $regex: search, $options: "i" } },
            ],
          },
        });
      }

      const countPipeline = [...pipeline, { $count: "total" }];
      const countResult = await vendorCreditModel.aggregate(countPipeline);
      const totalCount = countResult[0]?.total || 0;

      pipeline.push(
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit }
      );

      const data = await vendorCreditModel.aggregate(pipeline);

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        data,
        pagination: {
          totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
        },
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log("Failed to fetch vendor credit", error.message);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: error.message,
          statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        });
      }
      console.log("Failed to fetch vendor credit", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to fetch vendor credit",
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      });
    }
  };

  
  /**
   * Applies a vendor credit to one or more bills.
   * @description This method handles applying a vendor credit to multiple bills within a single transaction.
   * - It validates the vendor credit ID and ensures at least one bill application is provided.
   * - It retrieves the vendor credit and checks for sufficient balance.
   * - For each bill, it validates the bill ID, retrieves the bill, and ensures the applied amount does not exceed the balance due.
   * - It updates the balance due and status of each bill.
   * - It deducts the total applied amount from the vendor credit's balance and updates its status if fully used.
   * - All database operations are performed within a mongoose transaction to ensure data integrity.
   * @param req The Express request object, containing the vendor credit ID in params and `applyVendorCreditToBillDto` in the body.
   * @param res The Express response object used to send back the result.
   */
  applyCreditToBill = async (
    req: Request<{ id: string }, {}, applyVendorCreditToBillDto>,
    res: Response
  ) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const vendorCreditId = req.params.id;
      const { applications } = req.body;

      if (!this.isValidMongoId(vendorCreditId)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Invalid vendor credit id",
        });
      }

      if (!applications?.length) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "At least one bill is required",
        });
      }

      const vendorCredit = await vendorCreditModel
        .findOne({ _id: vendorCreditId, isDeleted: false })
        .session(session);

      if (!vendorCredit) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Vendor credit not found",
        });
      }

      const totalApplyAmount = applications.reduce(
        (sum, item) => sum + item.amountToApply,
        0
      );

      if (vendorCredit.balanceAmount < totalApplyAmount) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Insufficient vendor credit balance",
        });
      }

      let appliedBills: {
        billId: string;
        amount: number;
      }[] = [];

      for (const app of applications) {
        if (!this.isValidMongoId(app.billId)) {
          throw new Error(`Invalid bill id: ${app.billId}`);
        }

        const bill = await BillingSchemaModel.findOne({
          _id: app.billId,
          isDeleted: false,
        }).session(session);

        if (!bill) {
          throw new Error(`Bill not found: ${app.billId}`);
        }

        if (bill && bill.balanceDue && bill.balanceDue < app.amountToApply) {
          throw new Error(
            `Applied amount exceeds balance for bill ${bill.billNumber}`
          );
        }

        bill.balanceDue -= app.amountToApply;
        bill.vendorCreditAplliedDate = app.date ?? new Date();

        if (bill.balanceDue === 0) {
          bill.status = BillingRecordsStatus.PAID;
        }

        await bill.save({ session });

        appliedBills.push({
          billId: bill.id,
          amount: app.amountToApply,
        });
      }

      vendorCredit.balanceAmount -= totalApplyAmount;

      if (vendorCredit.balanceAmount === 0) {
        vendorCredit.status = commonStatus.CLOSED;
      }

      await vendorCredit.save({ session });

      await session.commitTransaction();
      session.endSession();

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Vendor credit applied to multiple bills successfully",
        data: {
          vendorCreditId,
          totalApplied: totalApplyAmount,
          remainingVendorCredit: vendorCredit.balanceAmount,
          appliedBills,
        },
      });
    } catch (error: unknown) {
      await session.abortTransaction();
      session.endSession();

      if (error instanceof Error) {
        console.error("Apply vendor credit failed:", error.message);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to apply vendor credit",
      });
    }
  };

  private async validateBranch(id: string) {
    if (!this.isValidMongoId(id)) {
      throw new Error("Invalid branch Id");
    }
    const existBranch = await this.branchModel.findById(id, {
      isDeleted: false,
    });
    if (!existBranch) {
      throw new Error("Branch not found");
    }
    return existBranch;
  }

  private async validateVendor(id: string) {
    if (!this.isValidMongoId(id)) {
      throw new Error("Invalid vendor Id");
    }
    const existVendor = await this.vendorModel.findById(id, {
      isDeleted: false,
    });
    if (!existVendor) {
      throw new Error("Vendor not found");
    }
    return existVendor;
  }

  private async validateItemReferences(items: ItemDto[]) {
    await this.validateIdsExist(
      itemModel,
      items.map((i) => i.itemId),
      "itemId"
    );

    await this.validateIdsExist(
      taxModel,
      items.map((i) => i.taxId),
      "taxId"
    );

    await this.validateIdsExist(
      accountModel,
      items.map((i) => i.accountId),
      "accountId"
    );

    await this.validateIdsExist(
      customerModel,
      items.map((i) => i.customerId),
      "customerId"
    );
  }

  private mapItems(itemsDto: ItemDto[]): IItem[] {
    return itemsDto.map((item) => ({
      itemId: item.itemId ? new Types.ObjectId(item.itemId) : null,
      taxId: item.taxId ? new Types.ObjectId(item.taxId) : null,
      prevItemId: item.prevItemId ? new Types.ObjectId(item.prevItemId) : null,
      itemName: item.itemName,
      qty: item.qty,
      rate: item.rate,
      amount: item.amount,
      unit: item.unit,
      discount: item.discount,
      customerId: item.customerId ? new Types.ObjectId(item.customerId) : null,
      accountId: item.accountId ? new Types.ObjectId(item.accountId) : null,
    }));
  }
}

export const vendorCreditController = new vendorCredit(
  branchModel,
  vendorModel,
  userModel
);
