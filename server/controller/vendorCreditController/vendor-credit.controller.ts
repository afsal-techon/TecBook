import { Model, Types } from "mongoose";
import { ItemDto } from "../../dto/item.dto";
import { GenericDatabaseService } from "../../Helper/GenericDatabase";
import {
  vendorCreditModel,
  vendorCreditModelDocument,
} from "../../models/vendor-credit.model";
import { IItem } from "../../Interfaces/item.interface";
import itemModel from "../../models/items";
import taxModel from "../../models/tax";
import accountModel from "../../models/accounts";
import customerModel from "../../models/customer";
import { Request, Response } from "express";
import { CreateVendorCreditDto } from "../../dto/vendor-credit.dto";
import { IVendorCredit } from "../../Interfaces/vendor-credit.interface";
import { HTTP_STATUS } from "../../constants/http-status";
import { IBranch, IVendor } from "../../types/common.types";
import branchModel from "../../models/branch";
import vendorModel from "../../models/vendor";

class vendorCredit extends GenericDatabaseService<vendorCreditModelDocument> {
  private readonly branchModel: Model<IBranch>;
  private readonly vendorModel: Model<IVendor>;

  constructor(branchModel: Model<IBranch>, vendorModel: Model<IVendor>) {
    super(vendorCreditModel);
    this.branchModel = branchModel;
    this.vendorModel = vendorModel;
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
  vendorModel
);
