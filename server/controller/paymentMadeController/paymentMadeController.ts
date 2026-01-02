import { Model, Types } from "mongoose";
import { Request, Response } from "express";
import { GenericDatabaseService } from "../../Helper/GenericDatabase";
import paymentMadeModel, {
  PaymentMadeModelDocument,
} from "../../models/payment-made.Model";
import { IUser } from "../../types/user.types";
import userModel from "../../models/user";
import { HTTP_STATUS } from "../../constants/http-status";
import {
  CreatePaymentMadeDto,
  UpdatePaymentMadeDto,
} from "../../dto/paymentMade.dto";
import {
  IAccounts,
  IBranch,
  IPaymentModes,
  IVendor,
} from "../../types/common.types";
import vendorModel from "../../models/vendor";
import branchModel from "../../models/branch";
import paymentModel from "../../models/paymentMode";
import accountModel from "../../models/accounts";
import { IPaymentMade } from "../../Interfaces/paymentMade.interface";
import { resolveUserAndAllowedBranchIds } from "../../Helper/branch-access.helper";
import { imagekit } from "../../config/imageKit";

class PaymentMadeController extends GenericDatabaseService<PaymentMadeModelDocument> {
  private readonly userModel: Model<IUser>;
  private readonly vendorModel: Model<IVendor>;
  private readonly branchModel: Model<IBranch>;
  private readonly paymentModeModel: Model<IPaymentModes>;
  private readonly accountModel: Model<IAccounts>;

  constructor(
    userModel: Model<IUser>,
    vendorModel: Model<IVendor>,
    branchModel: Model<IBranch>,
    paymentModeModel: Model<IPaymentModes>,
    accountModel: Model<IAccounts>
  ) {
    super(paymentMadeModel);
    this.userModel = userModel;
    this.vendorModel = vendorModel;
    this.branchModel = branchModel;
    this.paymentModeModel = paymentModeModel;
    this.accountModel = accountModel;
  }

  /**
   * Creates a new payment made record.
   * @description This method handles the creation of a new payment made record. It performs several validation checks:
   * - Ensures a user is authenticated.
   * - Validates the existence of the specified Vendor, Branch, Payment Mode, and Account.
   * It then constructs and saves a new payment made document to the database.
   * @param req The Express request object, containing the `CreatePaymentMadeDto` in the body.
   * @param res The Express response object used to send back the result.
   * @returns A Promise that resolves to void. Sends a JSON response with HTTP 201 (Created) on success.
   * @throws {Error} Throws an error if validation fails or if the database operation fails.
   */

  createPaymentMade = async (req: Request, res: Response) => {
    try {
      const dto: CreatePaymentMadeDto = req.body;
      const userId = req.user?.id;
      console.log("userId", userId);
      console.log("dto", dto);

      await this.validateUser(userId as string);

      if (dto.vendorId) await this.validateVendor(dto.vendorId);
      if (dto.branchId) await this.validateBranch(dto.branchId);
      if (dto.accountId) await this.validateAccount(dto.accountId);
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

      const payload: Partial<IPaymentMade> = {
        ...dto,
        createdBy: new Types.ObjectId(userId as string),
        vendorId: new Types.ObjectId(dto.vendorId),
        branchId: new Types.ObjectId(dto.branchId),
        accountId: new Types.ObjectId(dto.accountId),
        isDeleted: false,
        date: new Date(dto.date),
        documents: uploadedFiles,
      };

      await this.genericCreateOne(payload);

      return res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: "Payment made created successfully",
        statusCode: HTTP_STATUS.CREATED,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log("Error while creating payment made", error.message);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: error.message,
        });
      }
      console.log("Error while creating payment made", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to create payment made",
      });
    }
  };

  /**
   * Updates an existing payment made record.
   * @description This method handles updating an existing payment made record by its ID. It performs several validation checks:
   * - Validates the existence of the specified payment made record.
   * - Ensures a user is authenticated.
   * - Validates the existence of the specified Vendor, Branch, Payment Mode, and Account if they are provided in the update DTO.   * - Constructs and updates the payment made document in the database.
   * @param req The Express request object, containing the payment made ID in `req.params.id` and the `UpdatePaymentMadeDto` in the body.
   * @param res The Express response object used to send back the result.
   * @returns A Promise that resolves to void. Sends a JSON response with HTTP 200 (OK) on successful update.
   * @throws {Error} Throws an error if validation fails or if the database operation fails.
   */
  updatePaymentMadeByID = async (
    req: Request<{ id: string }, {}, UpdatePaymentMadeDto>,
    res: Response
  ) => {
    try {
      const id: string = req.params.id;
      await this.genericFindOneByIdOrNotFound(id);
      const dto: UpdatePaymentMadeDto = req.body;
      const userId = req.user?.id;

      await this.validateUser(userId as string);
      if (dto.vendorId) await this.validateVendor(dto.vendorId);
      if (dto.branchId) await this.validateBranch(dto.branchId);
      if (dto.accountId) await this.validateAccount(dto.accountId);

      const updatedPayload: Partial<IPaymentMade> = {
        ...dto,
        vendorId: dto.vendorId ? new Types.ObjectId(dto.vendorId) : undefined,
        branchId: dto.branchId ? new Types.ObjectId(dto.branchId) : undefined,
        accountId: dto.accountId
          ? new Types.ObjectId(dto.accountId)
          : undefined,
        date: dto.date ? new Date(dto.date) : undefined,
        documents:dto.existingDocuments ?? []
      };
      await this.genericUpdateOneById(id, updatedPayload);

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Payment made updated successfully",
        statusCode: HTTP_STATUS.OK,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log("Error while updating payment made", error.message);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).jsonp({
          success: false,
          message: error.message,
        });
      }
      console.log("Error while updating payment made", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).jsonp({
        success: false,
        message: "Failed to update payment made",
      });
    }
  };

  getSinglePaymentMadeDataById = async (req: Request, res: Response) => {
    try {
      const id: string = req.params.id;
      await this.genericFindOneByIdOrNotFound(id);
      const paymentMade = await paymentMadeModel.aggregate([
        {
          $match: {
            _id: new Types.ObjectId(id),
            isDeleted: false,
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
        {
          $unwind: {
            path: "$vendor",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "accounts",
            localField: "accountId",
            foreignField: "_id",
            as: "account",
          },
        },
        {
          $unwind: {
            path: "$account",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "paymentmodes",
            let: { paymentModeId: "$paymentModeId" },
            pipeline: [
              { $unwind: "$paymentModes" },
              {
                $match: {
                  $expr: {
                    $eq: ["$paymentModes._id", "$$paymentModeId"],
                  },
                },
              },
              {
                $project: {
                  _id: "$paymentModes._id",
                  paymentMode: "$paymentModes.paymentMode",
                },
              },
            ],
            as: "paymentMode",
          },
        },
        {
          $unwind: {
            path: "$paymentMode",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $project: {
            "vendor._id": 1,
            "vendor.name": 1,
            amount: 1,
            date: 1,
            bankCharge: 1,
            paymentId: 1,
            note: 1,
            "account._id": 1,
            "account.accountName": 1,
            "paymentMode._id": 1,
            "paymentMode.paymentMode": 1,
          },
        },
      ]);

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        data: paymentMade,
        statusCode: HTTP_STATUS.OK,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log(
          "Error while getting single payment made data by id",
          error.message
        );
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: error.message,
        });
      }
      console.log("Error while getting single payment made data by id", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to get single payment made data by id",
      });
    }
  };

  /*  * Get all payment made data with pagination and search functionality.
   * @description This method retrieves all payment made records from the database, with optional filtering by branch ID and search functionality.
   * It also handles pagination and populates related fields like vendor, account, and payment mode.
   * @param req The Express request object, which may contain `limit`, `page`, `search`, and `branchId` as query parameters.
   * @param res The Express response object used to send back the result.
   * @returns A Promise that resolves to void. Sends a JSON response with HTTP 200 (OK) on success.
   * @throws {Error} Throws an error if the database query fails or permission resolution encounters issues.
   */

  getAllPaymentMadeData = async (req: Request, res: Response) => {
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

      const pipeline: any[] = [
        {
          $match: {
            isDeleted: false,
            ...(allowedBranchIds.length && {
              branchId: {
                $in: allowedBranchIds.map((id) => new Types.ObjectId(id)),
              },
            }),
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

        {
          $lookup: {
            from: "accounts",
            localField: "accountId",
            foreignField: "_id",
            as: "account",
          },
        },
        { $unwind: { path: "$account", preserveNullAndEmptyArrays: true } },

        {
          $lookup: {
            from: "paymentmodes",
            let: { paymentModeId: "$paymentModeId" },
            pipeline: [
              { $unwind: "$paymentModes" },
              {
                $match: {
                  $expr: {
                    $eq: ["$paymentModes._id", "$$paymentModeId"],
                  },
                },
              },
              {
                $project: {
                  _id: "$paymentModes._id",
                  paymentMode: "$paymentModes.paymentMode",
                },
              },
            ],
            as: "paymentMode",
          },
        },
        { $unwind: { path: "$paymentMode", preserveNullAndEmptyArrays: true } },
        ...(search
          ? [
              {
                $match: {
                  $or: [
                    { paymentId: { $regex: search, $options: "i" } },
                    { "vendor.name": { $regex: search, $options: "i" } },
                    {
                      "account.accountName": { $regex: search, $options: "i" },
                    },
                    {
                      "paymentMode.paymentMode": {
                        $regex: search,
                        $options: "i",
                      },
                    },
                  ],
                },
              },
            ]
          : []),
        { $sort: { createdAt: -1 } },
        {
          $facet: {
            data: [
              { $skip: skip },
              { $limit: limit },
              {
                $project: {
                  _id: 1,
                  amount: 1,
                  date: 1,
                  bankCharge: 1,
                  paymentId: 1,
                  "vendor._id": 1,
                  "vendor.name": 1,
                  "account._id": 1,
                  "account.accountName": 1,
                  "paymentMode._id": 1,
                  "paymentMode.paymentMode": 1,
                  status:1,
                },
              },
            ],
            totalCount: [{ $count: "count" }],
          },
        },
      ];

      const result = await paymentMadeModel.aggregate(pipeline);

      const paymentMade = result[0]?.data || [];
      const totalCount = result[0]?.totalCount[0]?.count || 0;

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        data: paymentMade,
        statusCode: HTTP_STATUS.OK,
        pagination: {
          totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
        },
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log("Error while getting all payment made data", error.message);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: error.message,
        });
      }

      console.log("Error while getting all payment made data", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to get all payment made data",
      });
    }
  };

  deletePaymentMadeById = async (req: Request, res: Response) => {
    try {
      const id: string = req.params.id;
      await this.genericFindOneByIdOrNotFound(id);
      const userId = req.user?.id;
      await this.validateUser(userId as string);
      await this.genericDeleteOneById(id);
      return res.status(HTTP_STATUS.OK).json({
        status: res.status,
        message: "Payment made deleted successfully",
        statusCode: res.statusCode,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log("Error while deleting payment made", error.message);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: error.message,
        });
      }
      console.log("Error while deleting payment made", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to delete payment made",
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      });
    }
  };

  private async validateUser(id: string) {
    if (!this.isValidMongoId(id)) {
      throw new Error("Invalid user ID");
    }

    const user = await this.userModel.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  private async validateVendor(vendorId: string) {
    if (!this.isValidMongoId(vendorId)) {
      throw new Error("Invalid vendor ID");
    }

    const vendor = await this.vendorModel.findOne({
      _id: vendorId,
      isDeleted: false,
    });
    if (!vendor) throw new Error("Vendor not found");
    return vendor;
  }

  private async validateBranch(id: string) {
    if (!this.isValidMongoId(id)) {
      throw new Error("Invalid branch ID");
    }
    const branch = await this.branchModel.findOne({
      _id: id,
      isDeleted: false,
    });
    if (!branch) throw new Error("Branch not found");
    return branch;
  }



  private async validateAccount(id: string) {
    if (!this.isValidMongoId(id)) {
      throw new Error("Invalid account ID");
    }
    const account = await this.accountModel.findOne({
      _id: id,
      isDeleted: false,
    });
    if (!account) throw new Error("Account not found");
    return account;
  }
}

export const paymentMadeController = new PaymentMadeController(
  userModel,
  vendorModel,
  branchModel,
  paymentModel,
  accountModel
);
