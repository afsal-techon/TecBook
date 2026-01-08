import { FilterQuery, Model, Types } from "mongoose";
import { GenericDatabaseService } from "../../Helper/GenericDatabase";
import {
  CreditNoteModel,
  CreditNoteModelConstants,
  CreditNoteModelDocument,
} from "../../models/credtiNoteModel";
import { IBranch, ICustomer, ISalesPerson } from "../../types/common.types";
import branchModel from "../../models/branch";
import {
  CreateCreditNoteDto,
  UpdateCreditNoteDto,
} from "../../dto/credit-note.dto";
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
import { resolveUserAndAllowedBranchIds } from "../../Helper/branch-access.helper";
import accountModel from "../../models/accounts";
import taxModel from "../../models/tax";
import itemModel from "../../models/items";
import { IUser } from "../../types/user.types";
import userModel from "../../models/user";
import projectModel from "../../models/project";

class CreditNoteController extends GenericDatabaseService<CreditNoteModelDocument> {
  private readonly branchModel: Model<IBranch>;
  private readonly customerModel: Model<ICustomer>;
  private readonly salesPersoneModel: Model<ISalesPerson>;
  private readonly userModel: Model<IUser>;

  constructor(
    branchModel: Model<IBranch>,
    customerModel: Model<ICustomer>,
    salesPersoneModel: Model<ISalesPerson>,
    userModel: Model<IUser>
  ) {
    super(CreditNoteModel);
    this.branchModel = branchModel;
    this.customerModel = customerModel;
    this.salesPersoneModel = salesPersoneModel;
    this.userModel = userModel;
  }

  /**
   * Creates a new credit note.
   * @description This method handles the creation of a new credit note. It performs several validation checks:
   * - Ensures a user is authenticated.
   * - Validates the existence of the specified branch, customer, and sales person (if applicable).
   * - Generates a unique credit note number based on number settings.
   * - Uploads any attached documents to ImageKit.
   * - Maps item DTOs to the required schema format.
   * It then constructs and saves a new credit note document to the database.
   * @param req The Express request object, containing the `CreateCreditNoteDto` in the body.
   * @param res The Express response object used to send back the result.
   */
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

      await this.validateItemReferences(dto.items);
      const items: IItem[] = this.mapItems(dto.items);

      const numberSetting = await numberSettingModel.findOne({
        branchId: new Types.ObjectId(dto.branchId),
        docType: numberSettingsDocumentType.CREDIT_NOTE,
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
        createdBy: new Types.ObjectId(req.user?.id),
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

  /**
   * Updates an existing credit note.
   * @description This method handles the update of an existing credit note. It first validates the provided credit note ID.
   * It then validates the associated branch, customer, and sales person (if provided) to ensure their existence. Finally, it updates the credit note in the database with the new data.
   * @param req The Express request object, containing the credit note ID in `req.params.id` and the `UpdateCreditNoteDto` in the body.
   * @param res The Express response object used to send back the result.
   */
  updateCreditNoteById = async (
    req: Request<{ id: string }, {}, UpdateCreditNoteDto>,
    res: Response
  ) => {
    try {
      const { id } = req.params;

      if (!this.isValidMongoId(id)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Invalid credit note id",
        });
      }

      await this.genericFindOneByIdOrNotFound(id);

      const dto: UpdateCreditNoteDto = req.body;

      if (dto.branchId) await this.validateBranch(dto.branchId);
      if (dto.customerId) await this.validateCustomer(dto.customerId);
      if (dto.salesPersonId) await this.validateSalesPerson(dto.salesPersonId);

      await this.validateItemReferences(dto.items || []);
      const items: IItem[] = dto.items ? this.mapItems(dto.items) : [];
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

      const payload: Partial<ICreditNote> = {
        ...dto,
        branchId: dto.branchId ? new Types.ObjectId(dto.branchId) : undefined,
        customerId: dto.customerId
          ? new Types.ObjectId(dto.customerId)
          : undefined,
        salesPersonId: dto.salesPersonId
          ? new Types.ObjectId(dto.salesPersonId)
          : undefined,
        date: dto.date ? new Date(dto.date) : undefined,
        items,
        documents: finalDocuments,
      };

      await this.genericUpdateOneById(id, payload);

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Credit Note updated successfully",
        statusCode: HTTP_STATUS.OK,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log("Failed to update Credit Note", error.message);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: error.message,
          statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        });
      }
      console.log("Failed to update Credit Note", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to update Credit Note",
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      });
    }
  };

  /**
   * Retrieves all credit notes.
   * @description This method retrieves all credit notes from the database, with optional filtering by branch ID and search functionality.
   * It also handles pagination and populates related fields like branch, customer, and sales person.
   * @param req The Express request object, which may contain `limit`, `page`, `search`, and `branchId` as query parameters.
   * @param res The Express response object used to send back the result.
   */
  getAllCreditNotes = async (req: Request, res: Response) => {
    try {
      const authUser = req.user as { id: string };

      const limit = Number(req.query.limit) || 20;
      const page = Number(req.query.page) || 1;
      const skip = (page - 1) * limit;
      const search = (req.query.search as string) || "";
      const filterBranchId = req.query.branchId as string | undefined;
      const projectId = req.query.projectId as string | undefined;
      const { allowedBranchIds } = await resolveUserAndAllowedBranchIds({
        userId: authUser.id,
        userModel: this.userModel,
        branchModel: this.branchModel,
        requestedBranchId: filterBranchId,
      });

      const matchStage: any = {
        branchId: { $in: allowedBranchIds },
        isDeleted: false,
      };
      if (projectId) {
        if (!Types.ObjectId.isValid(projectId)) {
          return res.status(400).json({ message: "Invalid project ID!" });
        }
        const validateProject = await projectModel.findOne({
          _id: projectId,
          isDeleted: false,
        });
        if (!validateProject) {
          return res
            .status(HTTP_STATUS.BAD_REQUEST)
            .json({ message: "Project not found!" });
        }
        matchStage.projectId = new Types.ObjectId(projectId);
      }

      const pipeline: any[] = [
        { $match: matchStage },

        ,
        {
          $lookup: {
            from: "customers",
            localField: "customerId",
            foreignField: "_id",
            as: "customer",
          },
        },
        { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },

        {
          $lookup: {
            from: "salespeoples",
            localField: "salesPersonId",
            foreignField: "_id",
            as: "salesPerson",
          },
        },
        { $unwind: { path: "$salesPerson", preserveNullAndEmptyArrays: true } },
      ];

      if (search) {
        pipeline.push({
          $match: {
            $or: [
              { creditNoteNumber: { $regex: search, $options: "i" } },
              { subject: { $regex: search, $options: "i" } },
              { "customer.name": { $regex: search, $options: "i" } },
              { "salesPerson.name": { $regex: search, $options: "i" } },
            ],
          },
        });
      }

      const countPipeline = [...pipeline, { $count: "total" }];
      const countResult = await CreditNoteModel.aggregate(countPipeline);
      const totalCount = countResult[0]?.total || 0;

      pipeline.push(
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit }
      );

      const creditNotes = await CreditNoteModel.aggregate(pipeline);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: creditNotes,
        pagination: {
          totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
        },
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log("Failed to fetch Credit Note", error.message);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: error.message,
          statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        });
      }

      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to fetch Credit Note",
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      });
    }
  };

  /**
   * Retrieves a single credit note by ID.
   * @description This method retrieves a single credit note by its ID from the database.
   * It first validates the credit note ID, then fetches the credit note along with its related branch, customer, and sales person details.
   *   * @summary Deletes a credit note by ID.
   * @description This method deletes a credit note by its ID from the database.
   * It first validates the credit note ID, then updates the record to mark it as deleted.
   * @param req The Express request object, containing the credit note ID in `req.params.id`.
   * @param res The Express response object used to send back the result.
   */
  deleteCreditNote = async (req: Request<{ id: string }>, res: Response) => {
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
        console.error("Failed to delete credit note", error.message);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: error.message,
        });
      }
      console.log("Failed to delete credit note", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to delete credit note",
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      });
    }
  };

  /**
   ** Retrieves a single credit note by ID.
   * @description This method retrieves a single credit note by its ID from the database.
   * It first validates the credit note ID, then fetches the credit note along with its related branch, customer, and sales person details.
   * @param req The Express request object, containing the credit note ID in `req.params.id`.
   * @param res The Express response object used to send back the result.
   */
  getCreditNoteById = async (req: Request<{ id: string }>, res: Response) => {
    try {
      const { id } = req.params;

      if (!this.isValidMongoId(id)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Invalid credit note id",
        });
      }

      await this.genericFindOneByIdOrNotFound(id);

      const creditNote = await CreditNoteModel.findOne({
        _id: id,
        isDeleted: false,
      })
        .populate(CreditNoteModelConstants.customerId)
        .populate(CreditNoteModelConstants.salesPersonId)
        .populate(CreditNoteModelConstants.branchId);

      if (!creditNote) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Credit Note not found",
        });
      }

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        data: creditNote,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log("Failed to fetch Credit Note", error.message);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: error.message,
          statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        });
      }
      console.log("Failed to fetch Credit Note", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to fetch Credit Note",
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
  salesPersonModel,
  userModel
);
