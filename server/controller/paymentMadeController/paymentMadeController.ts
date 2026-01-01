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
import { dot } from "node:test/reporters";

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
      if (dto.paymentModeId) await this.validatePaymentMode(dto.paymentModeId);
      if (dto.accountId) await this.validateAccount(dto.accountId);

      const payload: Partial<IPaymentMade> = {
        ...dto,
        createdBy: new Types.ObjectId(userId as string),
        vendorId: new Types.ObjectId(dto.vendorId),
        branchId: new Types.ObjectId(dto.branchId),
        paymentModeId: new Types.ObjectId(dto.paymentModeId),
        accountId: new Types.ObjectId(dto.accountId),
        isDeleted: false,
        date: new Date(dto.date),
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
      if (dto.paymentModeId) await this.validatePaymentMode(dto.paymentModeId);
      if (dto.accountId) await this.validateAccount(dto.accountId);

      const updatedPayload: Partial<IPaymentMade> = {
        ...dto,
        vendorId: dto.vendorId ? new Types.ObjectId(dto.vendorId) : undefined,
        branchId: dto.branchId ? new Types.ObjectId(dto.branchId) : undefined,
        paymentModeId: dto.paymentModeId
          ? new Types.ObjectId(dto.paymentModeId)
          : undefined,
        accountId: dto.accountId
          ? new Types.ObjectId(dto.accountId)
          : undefined,
        date: dto.date ? new Date(dto.date) : undefined,
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

  private async validatePaymentMode(id: string) {
    if (!this.isValidMongoId(id)) {
      throw new Error("Invalid payment mode ID");
    }
    const paymentMode = await this.paymentModeModel.findOne({
      "paymentModes._id": id,
    });
    if (!paymentMode) throw new Error("Payment mode not found");
    return paymentMode;
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
