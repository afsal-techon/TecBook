import { Model, Types } from "mongoose";
import { GenericDatabaseService } from "../../Helper/GenericDatabase";
import {
  CreditNoteModel,
  CreditNoteModelConstants,
  CreditNoteModelDocument,
} from "../../models/credtiNoteModel";
import { IBranch, ICustomer, ISalesPerson } from "../../types/common.types";
import branchModel from "../../models/branch";
import { CreateCreditNoteDto } from "../../dto/credit-note.dto";
import { Request, Response } from "express";
import { HTTP_STATUS } from "../../constants/http-status";
import customerModel from "../../models/customer";
import salesPersonModel from "../../models/salesPerson";
import { imagekit } from "../../config/imageKit";
import { ICreditNote } from "../../Interfaces/credit-note.interface";
import { ItemDto } from "../../dto/item.dto";
import { IItem } from "../../Interfaces/item.interface";
import numberSettingModel from "../../models/numberSetting";
import { numberSettingsDocumentType } from "../../types/enum.types";
import { generateDocumentNumber } from "../../Helper/generateDocumentNumber";

class CreditNoteController extends GenericDatabaseService<CreditNoteModelDocument> {
  private readonly branchModel: Model<IBranch>;
  private readonly customerModel: Model<ICustomer>;
  private readonly salesPersoneModel: Model<ISalesPerson>;

  constructor(
    branchModel: Model<IBranch>,
    customerModel: Model<ICustomer>,
    salesPersoneModel: Model<ISalesPerson>
  ) {
    super(CreditNoteModel);
    this.branchModel = branchModel;
    this.customerModel = customerModel;
    this.salesPersoneModel = salesPersoneModel;
  }

  createCreditNote = async (
    req: Request<{}, {}, CreateCreditNoteDto>,
    res: Response
  ) => {
    try {
      const dto: CreateCreditNoteDto = req.body;

      if (dto.branchId) await this.validateBranch(dto.branchId);
      if (dto.customerId) await this.validateCustomer(dto.customerId);
      if (dto.salesPersonId) await this.validateSalesPerson(dto.salesPersonId);

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

      const numberSetting = await numberSettingModel.findOne({
        branchId: new Types.ObjectId(dto.branchId),
        docType: numberSettingsDocumentType.BILL,
      });

      if (!numberSetting) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message:
            "Number setting is not configured. Please configure it first.",
        });
      }

      const creditNoteNumber = await generateDocumentNumber({
        branchId: dto.branchId,
        manualId:
          numberSetting.mode !== "Auto" ? dto.creditNoteNumber : undefined,
        docType: numberSettingsDocumentType.CREDIT_NOTE,
        Model: CreditNoteModel,
        idField: CreditNoteModelConstants.creditNoteNumber,
      });

      const payload: Partial<ICreditNote> = {
        ...dto,
        documents: uploadedFiles,
        branchId: dto.branchId ? new Types.ObjectId(dto.branchId) : undefined,
        customerId: dto.customerId
          ? new Types.ObjectId(dto.customerId)
          : undefined,
        date: dto.date ? new Date(dto.date) : new Date(),
        salesPersonId: dto.salesPersonId
          ? new Types.ObjectId(dto.salesPersonId)
          : undefined,
        items,
        creditNoteNumber,
      };
      const data = await this.genericCreateOne(payload);
      return res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: "Credit Note created successfully",
        data,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log("Failed to create Credit Note", error.message);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: error.message,
          statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        });
      }
      console.log("Failed to create Credit Note", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to create Credit Note",
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      });
    }
  };

  private async validateBranch(id: string) {
    if (!this.isValidMongoId(id)) {
      throw new Error("Invalid branch Id");
    }
    const validateBranch = await this.branchModel.findById(id, {
      isDeleted: false,
    });
    if (!validateBranch) {
      throw new Error("Branch not found");
    }
    return validateBranch;
  }

  private async validateCustomer(id: string) {
    if (!this.isValidMongoId(id)) {
      throw new Error("Invalid customer Id");
    }
    const validateCustomer = await this.customerModel.findById(id, {
      isDeleted: false,
    });
    if (!validateCustomer) {
      throw new Error("Customer not found");
    }
    return validateCustomer;
  }

  private validateSalesPerson(id: string) {
    if (!this.isValidMongoId(id)) {
      throw new Error("Invalid sales person Id");
    }
    const validateSalesPerson = this.salesPersoneModel.findById(id, {
      isDeleted: false,
    });
    if (!validateSalesPerson) {
      throw new Error("Sales person not found");
    }
    return validateSalesPerson;
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

export const creditNoteController = new CreditNoteController(
  branchModel,
  customerModel,
  salesPersonModel
);
