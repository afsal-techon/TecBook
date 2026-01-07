"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.vendorCreditController = void 0;
const mongoose_1 = require("mongoose");
const GenericDatabase_1 = require("../../Helper/GenericDatabase");
const vendor_credit_model_1 = require("../../models/vendor-credit.model");
const items_1 = __importDefault(require("../../models/items"));
const tax_1 = __importDefault(require("../../models/tax"));
const accounts_1 = __importDefault(require("../../models/accounts"));
const customer_1 = __importDefault(require("../../models/customer"));
const http_status_1 = require("../../constants/http-status");
const branch_1 = __importDefault(require("../../models/branch"));
const vendor_1 = __importDefault(require("../../models/vendor"));
const branch_access_helper_1 = require("../../Helper/branch-access.helper");
const user_1 = __importDefault(require("../../models/user"));
const numberSetting_1 = __importDefault(require("../../models/numberSetting"));
const enum_types_1 = require("../../types/enum.types");
const generateDocumentNumber_1 = require("../../Helper/generateDocumentNumber");
const imageKit_1 = require("../../config/imageKit");
class vendorCredit extends GenericDatabase_1.GenericDatabaseService {
    constructor(branchModel, vendorModel, userModel) {
        super(vendor_credit_model_1.vendorCreditModel);
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
        this.createVendorCredit = async (req, res) => {
            try {
                const dto = req.body;
                await this.validateBranch(dto.branchId);
                await this.validateVendor(dto.vendorId);
                await this.validateItemReferences(dto.items);
                const numberSetting = await numberSetting_1.default.findOne({
                    branchId: new mongoose_1.Types.ObjectId(dto.branchId),
                    docType: enum_types_1.numberSettingsDocumentType.VENDOR_CREDIT,
                });
                if (!numberSetting) {
                    return res.status(http_status_1.HTTP_STATUS.BAD_REQUEST).json({
                        success: false,
                        message: "Number setting is not configured. Please configure it first.",
                    });
                }
                const vendorCreditNoteNumber = await (0, generateDocumentNumber_1.generateDocumentNumber)({
                    branchId: dto.branchId,
                    manualId: numberSetting.mode !== "Auto"
                        ? dto.vendorCreditNoteNumber
                        : undefined,
                    docType: enum_types_1.numberSettingsDocumentType.VENDOR_CREDIT,
                    Model: vendor_credit_model_1.vendorCreditModel,
                    idField: vendor_credit_model_1.vendorCreditModelConstants.vendorCreditNoteNumber,
                });
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
                const payload = {
                    ...dto,
                    vendorId: new mongoose_1.Types.ObjectId(dto.vendorId),
                    branchId: new mongoose_1.Types.ObjectId(dto.branchId),
                    date: new Date(dto.date),
                    items: this.mapItems(dto.items),
                    status: dto.status,
                    createdBy: new mongoose_1.Types.ObjectId(req.user?.id),
                    isDeleted: false,
                    balanceAmount: dto.total,
                    vendorCreditNoteNumber,
                    documents: uploadedFiles,
                };
                await this.genericCreateOne(payload);
                return res.status(http_status_1.HTTP_STATUS.CREATED).json({
                    success: true,
                    message: "Vendor credit created successfully",
                });
            }
            catch (error) {
                if (error instanceof Error) {
                    console.log("Failed to create vendor credit", error.message);
                    return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                        success: false,
                        message: error.message,
                    });
                }
                console.log("Failed to create vendor credit", error);
                return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    message: "Failed to create vendor credit",
                });
            }
        };
        this.updateVendorCredit = async (req, res) => {
            try {
                const { id } = req.params;
                const dto = req.body;
                if (!this.isValidMongoId(id)) {
                    return res.status(http_status_1.HTTP_STATUS.BAD_REQUEST).json({
                        success: false,
                        message: "Invalid vendor credit id",
                    });
                }
                await this.genericFindOneByIdOrNotFound(id);
                if (dto.items?.length) {
                    await this.validateItemReferences(dto.items);
                }
                let finalDocuments = [];
                if (dto.existingDocuments) {
                    const parsedDocs = Array.isArray(dto.existingDocuments)
                        ? dto.existingDocuments
                        : JSON.parse(dto.existingDocuments);
                    finalDocuments = parsedDocs
                        .map((doc) => (typeof doc === "string" ? doc : doc.doc_file))
                        .filter((d) => !!d);
                }
                if (req.files && Array.isArray(req.files)) {
                    for (const file of req.files) {
                        const uploaded = await imageKit_1.imagekit.upload({
                            file: file.buffer.toString("base64"),
                            fileName: file.originalname,
                            folder: "/images",
                        });
                        finalDocuments.push(uploaded.url);
                    }
                }
                const payload = {
                    ...dto,
                    vendorId: dto.vendorId ? new mongoose_1.Types.ObjectId(dto.vendorId) : undefined,
                    branchId: dto.branchId ? new mongoose_1.Types.ObjectId(dto.branchId) : undefined,
                    date: dto.date ? new Date(dto.date) : undefined,
                    items: dto.items ? this.mapItems(dto.items) : undefined,
                    documents: finalDocuments,
                };
                await this.genericUpdateOneById(id, payload);
                return res.status(http_status_1.HTTP_STATUS.OK).json({
                    success: true,
                    message: "Vendor credit updated successfully",
                });
            }
            catch (error) {
                if (error instanceof Error) {
                    console.log("Failed to update vendor credit", error.message);
                    return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                        success: false,
                        message: error.message,
                    });
                }
                console.log("Failed to update vendor credit", error);
                return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
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
        this.deleteVendorCredit = async (req, res) => {
            try {
                const { id } = req.params;
                await this.genericFindOneByIdOrNotFound(id);
                const result = await this.genericDeleteOneById(id);
                return res.status(result.statusCode).json({
                    success: result.success,
                    message: result.message,
                });
            }
            catch (error) {
                if (error instanceof Error) {
                    console.error("Failed to delete vendor credit", error.message);
                    return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                        success: false,
                        message: error.message,
                    });
                }
                console.log("Failed to delete vendor credit", error);
                return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    message: "Failed to delete vendor credit",
                    statusCode: http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR,
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
        this.getVendorCreditById = async (req, res) => {
            try {
                const { id } = req.params;
                if (!this.isValidMongoId(id)) {
                    return res.status(http_status_1.HTTP_STATUS.BAD_REQUEST).json({
                        success: false,
                        message: "Invalid vendor credit id",
                    });
                }
                await this.genericFindOneByIdOrNotFound(id);
                const data = await vendor_credit_model_1.vendorCreditModel
                    .findOne({ _id: id, isDeleted: false })
                    .populate({
                    path: vendor_credit_model_1.vendorCreditModelConstants.vendorId,
                    select: "_id name",
                })
                    .populate(vendor_credit_model_1.vendorCreditModelConstants.branchId);
                if (!data) {
                    return res.status(http_status_1.HTTP_STATUS.NOT_FOUND).json({
                        success: false,
                        message: "Vendor credit not found",
                    });
                }
                return res.status(http_status_1.HTTP_STATUS.OK).json({
                    success: true,
                    data,
                });
            }
            catch (error) {
                if (error instanceof Error) {
                    console.error("Failed to fetch vendor credit", error.message);
                    return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                        success: false,
                        message: error.message,
                    });
                }
                console.log("Failed to fetch vendor credit", error);
                return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    message: "Failed to fetch vendor credit",
                    statusCode: http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR,
                });
            }
        };
        /*  Retrieves all vendor credits with optional filtering, search, and pagination.
         * @param req The Express request object, which may contain `limit`, `page`, `search`, and `branchId` as query parameters.
         * @param res The Express response object used to send back the result.
         */
        this.getAllVendorCredits = async (req, res) => {
            try {
                const authUser = req.user;
                const limit = Number(req.query.limit) || 20;
                const page = Number(req.query.page) || 1;
                const skip = (page - 1) * limit;
                const search = req.query.search || "";
                const filterBranchId = req.query.branchId;
                const { allowedBranchIds } = await (0, branch_access_helper_1.resolveUserAndAllowedBranchIds)({
                    userId: authUser.id,
                    userModel: this.userModel,
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
                const countResult = await vendor_credit_model_1.vendorCreditModel.aggregate(countPipeline);
                const totalCount = countResult[0]?.total || 0;
                pipeline.push({ $sort: { createdAt: -1 } }, { $skip: skip }, { $limit: limit });
                const data = await vendor_credit_model_1.vendorCreditModel.aggregate(pipeline);
                return res.status(http_status_1.HTTP_STATUS.OK).json({
                    success: true,
                    data,
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
                    console.log("Failed to fetch vendor credit", error.message);
                    return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                        success: false,
                        message: error.message,
                        statusCode: http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR,
                    });
                }
                console.log("Failed to fetch vendor credit", error);
                return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    message: "Failed to fetch vendor credit",
                    statusCode: http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR,
                });
            }
        };
        this.branchModel = branchModel;
        this.vendorModel = vendorModel;
        this.userModel = userModel;
    }
    async validateBranch(id) {
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
    async validateVendor(id) {
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
    async validateItemReferences(items) {
        await this.validateIdsExist(items_1.default, items.map((i) => i.itemId), "itemId");
        await this.validateIdsExist(tax_1.default, items.map((i) => i.taxId), "taxId");
        await this.validateIdsExist(accounts_1.default, items.map((i) => i.accountId), "accountId");
        await this.validateIdsExist(customer_1.default, items.map((i) => i.customerId), "customerId");
    }
    mapItems(itemsDto) {
        return itemsDto.map((item) => ({
            itemId: item.itemId ? new mongoose_1.Types.ObjectId(item.itemId) : null,
            taxId: item.taxId ? new mongoose_1.Types.ObjectId(item.taxId) : null,
            prevItemId: item.prevItemId ? new mongoose_1.Types.ObjectId(item.prevItemId) : null,
            itemName: item.itemName,
            qty: item.qty,
            rate: item.rate,
            amount: item.amount,
            unit: item.unit,
            discount: item.discount,
            customerId: item.customerId ? new mongoose_1.Types.ObjectId(item.customerId) : null,
            accountId: item.accountId ? new mongoose_1.Types.ObjectId(item.accountId) : null,
        }));
    }
}
exports.vendorCreditController = new vendorCredit(branch_1.default, vendor_1.default, user_1.default);
