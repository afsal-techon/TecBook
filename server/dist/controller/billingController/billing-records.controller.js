"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const GenericDatabase_1 = require("../../Helper/GenericDatabase");
const BillingRecordsModel_1 = require("../../models/BillingRecordsModel");
const http_status_1 = require("../../constants/http-status");
const vendor_1 = __importDefault(require("../../models/vendor"));
const branch_1 = __importDefault(require("../../models/branch"));
const user_1 = __importDefault(require("../../models/user"));
const purchase_order_controller_1 = __importDefault(require("../PurchaseOrderController/purchase-order.controller"));
const branch_access_helper_1 = require("../../Helper/branch-access.helper");
const purchaseOrderModel_1 = require("../../models/purchaseOrderModel");
const imageKit_1 = require("../../config/imageKit");
class BillingRecordsController extends GenericDatabase_1.GenericDatabaseService {
    constructor(dbModel, vendorModel, userModel, branchModel, purchaseOrderService = purchase_order_controller_1.default) {
        super(dbModel);
        this.purchaseOrderService = purchaseOrderService;
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
        this.createBillingRecords = async (req, res) => {
            try {
                const dto = req.body;
                const userId = req.user?.id;
                if (!this.isValidMongoId(userId)) {
                    return res.status(http_status_1.HTTP_STATUS.BAD_REQUEST).json({
                        success: false,
                        message: "Invalid user id",
                    });
                }
                await this.validateUser(userId);
                await this.validateBranch(dto.branchId);
                await this.validateVendor(dto.vendorId);
                const billDate = new Date(dto.billDate);
                const dueDate = new Date(dto.dueDate);
                if (dueDate < billDate) {
                    return res.status(http_status_1.HTTP_STATUS.BAD_REQUEST).json({
                        success: false,
                        message: "Due date must be greater than bill date",
                    });
                }
                const items = this.mapItems(dto.items);
                await this.purchaseOrderService.genericFindOneByIdOrNotFound(dto.purchaseOrderNumber);
                if (!userId) {
                    return res.status(http_status_1.HTTP_STATUS.UNAUTHORIZED).json({
                        success: false,
                        message: "Unauthorized",
                    });
                }
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
                    createdBy: new mongoose_1.Types.ObjectId(userId),
                    items: items,
                    isDeleted: false,
                    vendorId: new mongoose_1.Types.ObjectId(dto.vendorId),
                    purchaseOrderNumber: new mongoose_1.Types.ObjectId(dto.purchaseOrderNumber),
                    branchId: new mongoose_1.Types.ObjectId(dto.branchId),
                    billDate: new Date(dto.billDate),
                    dueDate: new Date(dto.dueDate),
                    documents: uploadedFiles,
                };
                const data = await this.genericCreateOne(payload);
                return res.status(http_status_1.HTTP_STATUS.CREATED).json({
                    success: true,
                    message: "Billing record created successfully",
                    data,
                });
            }
            catch (error) {
                if (error instanceof Error) {
                    console.log("Error while creating billing record", error.message);
                    return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                        success: false,
                        message: error.message,
                    });
                }
                console.log("Error while creating billing record", error);
                return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
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
        this.updateBillingRecords = async (req, res) => {
            try {
                const id = req.params.id;
                if (!this.isValidMongoId(id)) {
                    return res.status(http_status_1.HTTP_STATUS.BAD_REQUEST).json({
                        success: false,
                        message: "Invalid billing record id",
                    });
                }
                const dto = req.body;
                let billDate;
                let dueDate;
                if (dto.billDate) {
                    billDate = new Date(dto.billDate);
                }
                if (dto.dueDate) {
                    dueDate = new Date(dto.dueDate);
                }
                if (billDate && dueDate && dueDate < billDate) {
                    return res.status(http_status_1.HTTP_STATUS.BAD_REQUEST).json({
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
                    await this.purchaseOrderService.genericFindOneByIdOrNotFound(dto.purchaseOrderNumber);
                }
                const items = dto.items ? this.mapItems(dto.items) : [];
                const payload = {
                    vendorId: dto.vendorId ? new mongoose_1.Types.ObjectId(dto.vendorId) : undefined,
                    branchId: dto.branchId ? new mongoose_1.Types.ObjectId(dto.branchId) : undefined,
                    purchaseOrderNumber: dto.purchaseOrderNumber
                        ? new mongoose_1.Types.ObjectId(dto.purchaseOrderNumber)
                        : undefined,
                    billDate,
                    dueDate,
                    items,
                    documents: dto.existingDocuments ?? [],
                };
                await this.genericUpdateOneById(id, payload);
                return res.status(http_status_1.HTTP_STATUS.OK).json({
                    success: true,
                    message: "Billing record updated successfully",
                    statusCode: http_status_1.HTTP_STATUS.OK,
                });
            }
            catch (error) {
                if (error instanceof Error) {
                    console.log("Error while updating billing record", error.message);
                    return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                        success: false,
                        message: error.message,
                    });
                }
                console.log("Error while updating billing record", error);
                return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
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
        this.getAllBillingRecords = async (req, res, next) => {
            try {
                const authUser = req.user;
                const limit = parseInt(req.query.limit) || 20;
                const page = parseInt(req.query.page) || 1;
                const skip = (page - 1) * limit;
                const search = req.query.search || "";
                const filterBranchId = req.query.branchId;
                const { user, allowedBranchIds } = await (0, branch_access_helper_1.resolveUserAndAllowedBranchIds)({
                    userId: authUser.id,
                    userModel: this.userModel,
                    branchModel: this.branchModel,
                    requestedBranchId: filterBranchId,
                });
                // console.log("allowedBranchIds", allowedBranchIds);
                const query = {
                    isDeleted: false,
                    branchId: { $in: allowedBranchIds },
                };
                if (search) {
                    query.quoteNumber = { $regex: search, $options: "i" };
                }
                const totalCount = await BillingRecordsModel_1.BillingSchemaModel.countDocuments(query);
                // console.log('count', totalCount)
                const billingRecords = await BillingRecordsModel_1.BillingSchemaModel.find(query)
                    .sort({ createdAt: -1 })
                    .populate(BillingRecordsModel_1.BillingSchemaModelConstants.vendorId)
                    .populate({
                    path: BillingRecordsModel_1.BillingSchemaModelConstants.purchaseOrderNumber,
                    select: `${purchaseOrderModel_1.PurchaseOrderModelConstants.purchaseOrderId}`,
                })
                    .populate(BillingRecordsModel_1.BillingSchemaModelConstants.branchId)
                    .skip(skip)
                    .limit(limit);
                res.status(http_status_1.HTTP_STATUS.OK).json({
                    success: true,
                    data: billingRecords,
                    pagination: {
                        totalCount,
                        page,
                        limit,
                        totalPages: Math.ceil(totalCount / limit),
                    },
                });
            }
            catch (error) {
                res.status(error.statusCode || http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
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
        this.getBillingRecordById = async (req, res, next) => {
            try {
                const { id } = req.params;
                if (!this.isValidMongoId(id)) {
                    return res.status(http_status_1.HTTP_STATUS.BAD_REQUEST).json({
                        success: false,
                        message: "Invalid Billing record order id",
                    });
                }
                const billingRecord = await BillingRecordsModel_1.BillingSchemaModel.findOne({
                    _id: id,
                    isDeleted: false,
                })
                    .populate(BillingRecordsModel_1.BillingSchemaModelConstants.vendorId)
                    .populate({
                    path: BillingRecordsModel_1.BillingSchemaModelConstants.purchaseOrderNumber,
                    select: `${purchaseOrderModel_1.PurchaseOrderModelConstants.purchaseOrderId}`,
                })
                    .populate(BillingRecordsModel_1.BillingSchemaModelConstants.branchId);
                if (!billingRecord) {
                    return res.status(http_status_1.HTTP_STATUS.NOT_FOUND).json({
                        success: false,
                        message: "Billing record not found",
                    });
                }
                res.status(http_status_1.HTTP_STATUS.OK).json({
                    success: true,
                    data: billingRecord,
                });
            }
            catch (error) {
                if (error instanceof Error) {
                    console.log("Error while fetching Billing Record", error.message);
                    return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                        success: false,
                        message: error.message,
                    });
                }
                console.log("Error while fetching Billing Record", error);
                next(error);
            }
        };
        this.vendorModel = vendorModel;
        this.userModel = userModel;
        this.branchModel = branchModel;
    }
    async validateUser(id) {
        const user = await this.userModel.findOne({
            _id: id,
            isDeleted: false,
        });
        if (!user)
            throw new Error("User not found");
        return user;
    }
    async validateBranch(id) {
        const branch = await this.branchModel.findOne({
            _id: id,
            isDeleted: false,
        });
        if (!branch)
            throw new Error("Branch not found");
        return branch;
    }
    async validateVendor(id) {
        const vendor = await this.vendorModel.findOne({
            _id: id,
            isDeleted: false,
        });
        if (!vendor)
            throw new Error("Vendor not found");
        return vendor;
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
            customerId: item.customerId ? new mongoose_1.Types.ObjectId(item.customerId) : undefined,
            accountId: item.accountId ? new mongoose_1.Types.ObjectId(item.accountId) : undefined,
        }));
    }
}
exports.default = new BillingRecordsController(BillingRecordsModel_1.BillingSchemaModel, vendor_1.default, user_1.default, branch_1.default);
