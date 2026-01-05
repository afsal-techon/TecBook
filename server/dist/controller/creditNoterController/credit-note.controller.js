"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.creditNoteController = void 0;
const mongoose_1 = require("mongoose");
const GenericDatabase_1 = require("../../Helper/GenericDatabase");
const credtiNoteModel_1 = require("../../models/credtiNoteModel");
const branch_1 = __importDefault(require("../../models/branch"));
const http_status_1 = require("../../constants/http-status");
const customer_1 = __importDefault(require("../../models/customer"));
const salesPerson_1 = __importDefault(require("../../models/salesPerson"));
const imageKit_1 = require("../../config/imageKit");
const numberSetting_1 = __importDefault(require("../../models/numberSetting"));
const enum_types_1 = require("../../types/enum.types");
const generateDocumentNumber_1 = require("../../Helper/generateDocumentNumber");
const branch_access_helper_1 = require("../../Helper/branch-access.helper");
class CreditNoteController extends GenericDatabase_1.GenericDatabaseService {
    constructor(branchModel, customerModel, salesPersoneModel) {
        super(credtiNoteModel_1.CreditNoteModel);
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
        this.createCreditNote = async (req, res) => {
            try {
                const dto = req.body;
                if (dto.branchId)
                    await this.validateBranch(dto.branchId);
                if (dto.customerId)
                    await this.validateCustomer(dto.customerId);
                if (dto.salesPersonId)
                    await this.validateSalesPerson(dto.salesPersonId);
                const uploadedFiles = [];
                if (req.files && Array.isArray(req.files)) {
                    for (const file of req.files) {
                        const uploadResponse = await imageKit_1.imagekit.upload({
                            file: file.buffer.toString("base64"),
                            fileName: file.originalname,
                            folder: "/images",
                        });
                        uploadedFiles.push(uploadResponse.url);
                    }
                }
                const items = this.mapItems(dto.items);
                const numberSetting = await numberSetting_1.default.findOne({
                    branchId: new mongoose_1.Types.ObjectId(dto.branchId),
                    docType: enum_types_1.numberSettingsDocumentType.BILL,
                });
                if (!numberSetting) {
                    return res.status(http_status_1.HTTP_STATUS.BAD_REQUEST).json({
                        success: false,
                        message: "Number setting is not configured. Please configure it first.",
                    });
                }
                const creditNoteNumber = await (0, generateDocumentNumber_1.generateDocumentNumber)({
                    branchId: dto.branchId,
                    manualId: numberSetting.mode !== "Auto" ? dto.creditNoteNumber : undefined,
                    docType: enum_types_1.numberSettingsDocumentType.CREDIT_NOTE,
                    Model: credtiNoteModel_1.CreditNoteModel,
                    idField: credtiNoteModel_1.CreditNoteModelConstants.creditNoteNumber,
                });
                const payload = {
                    ...dto,
                    documents: uploadedFiles,
                    branchId: dto.branchId ? new mongoose_1.Types.ObjectId(dto.branchId) : undefined,
                    customerId: dto.customerId
                        ? new mongoose_1.Types.ObjectId(dto.customerId)
                        : undefined,
                    date: dto.date ? new Date(dto.date) : new Date(),
                    salesPersonId: dto.salesPersonId
                        ? new mongoose_1.Types.ObjectId(dto.salesPersonId)
                        : undefined,
                    items,
                    creditNoteNumber,
                };
                const data = await this.genericCreateOne(payload);
                return res.status(http_status_1.HTTP_STATUS.CREATED).json({
                    success: true,
                    message: "Credit Note created successfully",
                    data,
                });
            }
            catch (error) {
                if (error instanceof Error) {
                    console.log("Failed to create Credit Note", error.message);
                    return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                        success: false,
                        message: error.message,
                        statusCode: http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR,
                    });
                }
                console.log("Failed to create Credit Note", error);
                return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    message: "Failed to create Credit Note",
                    statusCode: http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR,
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
        this.updateCreditNoteById = async (req, res) => {
            try {
                const { id } = req.params;
                if (!this.isValidMongoId(id)) {
                    return res.status(http_status_1.HTTP_STATUS.BAD_REQUEST).json({
                        success: false,
                        message: "Invalid credit note id",
                    });
                }
                await this.genericFindOneByIdOrNotFound(id);
                const dto = req.body;
                if (dto.branchId)
                    await this.validateBranch(dto.branchId);
                if (dto.customerId)
                    await this.validateCustomer(dto.customerId);
                if (dto.salesPersonId)
                    await this.validateSalesPerson(dto.salesPersonId);
                const items = dto.items ? this.mapItems(dto.items) : [];
                const payload = {
                    ...dto,
                    branchId: dto.branchId ? new mongoose_1.Types.ObjectId(dto.branchId) : undefined,
                    customerId: dto.customerId
                        ? new mongoose_1.Types.ObjectId(dto.customerId)
                        : undefined,
                    salesPersonId: dto.salesPersonId
                        ? new mongoose_1.Types.ObjectId(dto.salesPersonId)
                        : undefined,
                    date: dto.date ? new Date(dto.date) : undefined,
                    items,
                    documents: dto.existingDocuments ?? [],
                };
                await this.genericUpdateOneById(id, payload);
                return res.status(http_status_1.HTTP_STATUS.OK).json({
                    success: true,
                    message: "Credit Note updated successfully",
                    statusCode: http_status_1.HTTP_STATUS.OK,
                });
            }
            catch (error) {
                if (error instanceof Error) {
                    console.log("Failed to update Credit Note", error.message);
                    return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                        success: false,
                        message: error.message,
                        statusCode: http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR,
                    });
                }
                console.log("Failed to update Credit Note", error);
                return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    message: "Failed to update Credit Note",
                    statusCode: http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR,
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
        this.getAllCreditNotes = async (req, res) => {
            try {
                const authUser = req.user;
                const limit = Number(req.query.limit) || 20;
                const page = Number(req.query.page) || 1;
                const skip = (page - 1) * limit;
                const search = req.query.search || "";
                const filterBranchId = req.query.branchId;
                const { allowedBranchIds } = await (0, branch_access_helper_1.resolveUserAndAllowedBranchIds)({
                    userId: authUser.id,
                    userModel: undefined,
                    branchModel: this.branchModel,
                    requestedBranchId: filterBranchId,
                });
                const pipeline = [
                    {
                        $match: {
                            isDeleted: false,
                            branchId: { $in: allowedBranchIds },
                        },
                    },
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
                const countResult = await credtiNoteModel_1.CreditNoteModel.aggregate(countPipeline);
                const totalCount = countResult[0]?.total || 0;
                pipeline.push({ $sort: { createdAt: -1 } }, { $skip: skip }, { $limit: limit });
                const creditNotes = await credtiNoteModel_1.CreditNoteModel.aggregate(pipeline);
                res.status(http_status_1.HTTP_STATUS.OK).json({
                    success: true,
                    data: creditNotes,
                    pagination: {
                        totalCount,
                        page,
                        limit,
                        totalPages: Math.ceil(totalCount / limit),
                    },
                });
            }
            catch (error) {
                if (error instanceof Error) {
                    console.log("Failed to fetch Credit Note", error.message);
                    return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                        success: false,
                        message: error.message,
                        statusCode: http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR,
                    });
                }
                return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    message: "Failed to fetch Credit Note",
                    statusCode: http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR,
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
        this.deleteCreditNote = async (req, res) => {
            try {
                const { id } = req.params;
                const result = await this.genericDeleteOneById(id);
                return res.status(result.statusCode).json({
                    success: result.success,
                    message: result.message,
                    statusCode: result.statusCode,
                });
            }
            catch (error) {
                if (error instanceof Error) {
                    console.error("Failed to delete credit note", error.message);
                    return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                        success: false,
                        message: error.message,
                    });
                }
                console.log("Failed to delete credit note", error);
                return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    message: "Failed to delete credit note",
                    statusCode: http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR,
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
        this.getCreditNoteById = async (req, res) => {
            try {
                const { id } = req.params;
                if (!this.isValidMongoId(id)) {
                    return res.status(http_status_1.HTTP_STATUS.BAD_REQUEST).json({
                        success: false,
                        message: "Invalid credit note id",
                    });
                }
                await this.genericFindOneByIdOrNotFound(id);
                const creditNote = await credtiNoteModel_1.CreditNoteModel.findOne({
                    _id: id,
                    isDeleted: false,
                })
                    .populate(credtiNoteModel_1.CreditNoteModelConstants.customerId)
                    .populate(credtiNoteModel_1.CreditNoteModelConstants.salesPersonId)
                    .populate(credtiNoteModel_1.CreditNoteModelConstants.branchId);
                if (!creditNote) {
                    return res.status(http_status_1.HTTP_STATUS.NOT_FOUND).json({
                        success: false,
                        message: "Credit Note not found",
                    });
                }
                return res.status(http_status_1.HTTP_STATUS.OK).json({
                    success: true,
                    data: creditNote,
                });
            }
            catch (error) {
                if (error instanceof Error) {
                    console.log("Failed to fetch Credit Note", error.message);
                    return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                        success: false,
                        message: error.message,
                        statusCode: http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR,
                    });
                }
                console.log("Failed to fetch Credit Note", error);
                return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    message: "Failed to fetch Credit Note",
                    statusCode: http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR,
                });
            }
        };
        this.branchModel = branchModel;
        this.customerModel = customerModel;
        this.salesPersoneModel = salesPersoneModel;
    }
    async validateBranch(id) {
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
    async validateCustomer(id) {
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
    validateSalesPerson(id) {
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
    mapItems(itemsDto) {
        return itemsDto.map((item) => ({
            itemId: new mongoose_1.Types.ObjectId(item.itemId),
            taxId: new mongoose_1.Types.ObjectId(item.taxId),
            prevItemId: item.prevItemId
                ? new mongoose_1.Types.ObjectId(item.prevItemId)
                : undefined,
            itemName: item.itemName,
            qty: item.qty,
            rate: item.rate,
            amount: item.amount,
            unit: item.unit,
            discount: item.discount,
            customerId: item.customerId
                ? new mongoose_1.Types.ObjectId(item.customerId)
                : undefined,
            accountId: item.accountId
                ? new mongoose_1.Types.ObjectId(item.accountId)
                : undefined,
        }));
    }
}
exports.creditNoteController = new CreditNoteController(branch_1.default, customer_1.default, salesPerson_1.default);
