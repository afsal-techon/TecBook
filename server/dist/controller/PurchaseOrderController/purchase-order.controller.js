"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const GenericDatabase_1 = require("../../Helper/GenericDatabase");
const purchaseOrderModel_1 = require("../../models/purchaseOrderModel");
const vendor_1 = __importDefault(require("../../models/vendor"));
const user_1 = __importDefault(require("../../models/user"));
const project_1 = __importDefault(require("../../models/project"));
const http_status_1 = require("../../constants/http-status");
const branch_1 = __importDefault(require("../../models/branch"));
const branch_access_helper_1 = require("../../Helper/branch-access.helper");
const imageKit_1 = require("../../config/imageKit");
const salesPerson_1 = __importDefault(require("../../models/salesPerson"));
const paymentTerms_1 = __importDefault(require("../../models/paymentTerms"));
const generateDocumentNumber_1 = require("../../Helper/generateDocumentNumber");
const numberSetting_1 = __importDefault(require("../../models/numberSetting"));
const enum_types_1 = require("../../types/enum.types");
class PurchaseOrderController extends GenericDatabase_1.GenericDatabaseService {
    constructor(vendorModel, userModel, projectModel, branchModel, salesModel, paymentTermsModel) {
        super(purchaseOrderModel_1.PurchaseOrderModel);
        /**
         * @summary Creates a new purchase order.
         * @description This method handles the creation of a new purchase order. It performs several validation checks:
         * - Ensures a user is authenticated.
         * - Validates that the expiry date is later than the quote date.
         * - Confirms the existence of the specified vendor, salesman, and project (if applicable).
         * It then constructs and saves a new purchase order document to the database.
         * @param req The Express request object, containing the `CreatePurchaseOrderDto` in the body.
         * @param res The Express response object used to send back the result.
         * @param next The Express next function to pass control to the next middleware.
         */
        this.createPurchaseOrder = async (req, res) => {
            try {
                const dto = req.body;
                console.log(dto, "dto");
                console.log(req.body, "req.body");
                const userId = req.user?.id;
                if (!userId) {
                    return res.status(http_status_1.HTTP_STATUS.UNAUTHORIZED).json({
                        success: false,
                        message: "Unauthorized",
                    });
                }
                const numberSetting = await numberSetting_1.default.findOne({
                    branchId: new mongoose_1.Types.ObjectId(dto.branchId),
                    docType: enum_types_1.numberSettingsDocumentType.PURCHASE_ORDER,
                });
                if (!numberSetting)
                    return res.status(http_status_1.HTTP_STATUS.BAD_REQUEST).json({
                        success: false,
                        message: "Number setting is not configured. Please configure it first.",
                    });
                const purchaseOrderNumber = await (0, generateDocumentNumber_1.generateDocumentNumber)({
                    branchId: dto.branchId,
                    manualId: numberSetting?.mode !== 'Auto' ? dto.purchaseOrderId : undefined,
                    docType: enum_types_1.numberSettingsDocumentType.PURCHASE_ORDER,
                    Model: purchaseOrderModel_1.PurchaseOrderModel,
                    idField: purchaseOrderModel_1.PurchaseOrderModelConstants.purchaseOrderId,
                });
                const quoteDate = new Date(dto.purchaseOrderDate);
                const expiryDate = new Date(dto.expDate);
                if (expiryDate < quoteDate) {
                    return res.status(http_status_1.HTTP_STATUS.BAD_REQUEST).json({
                        success: false,
                        message: "Expiry date must be greater than quote date",
                    });
                }
                await this.validateVendor(dto.vendorId);
                await this.validateSalesman(dto.salesPersonId);
                if (dto.projectId)
                    await this.validateProject(dto.projectId);
                if (dto.paymentTermsId)
                    await this.validatePaymenetTerms(dto.paymentTermsId);
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
                const payload = {
                    ...dto,
                    vendorId: new mongoose_1.Types.ObjectId(dto.vendorId),
                    purchaseOrderId: purchaseOrderNumber,
                    quote: dto.quote,
                    purchaseOrderDate: quoteDate,
                    expDate: expiryDate,
                    salesPersonId: new mongoose_1.Types.ObjectId(dto.salesPersonId),
                    projectId: dto.projectId
                        ? new mongoose_1.Types.ObjectId(dto.projectId)
                        : undefined,
                    items,
                    createdBy: new mongoose_1.Types.ObjectId(userId) ?? undefined,
                    branchId: new mongoose_1.Types.ObjectId(dto.branchId),
                    documents: uploadedFiles,
                    paymentTermsId: dto.paymentTermsId
                        ? new mongoose_1.Types.ObjectId(dto.paymentTermsId)
                        : undefined,
                };
                const purchaseOrder = await this.genericCreateOne(payload);
                res.status(http_status_1.HTTP_STATUS.CREATED).json({
                    success: true,
                    message: "Purchase order created successfully",
                    data: purchaseOrder,
                });
            }
            catch (error) {
                if (error instanceof Error) {
                    console.error("Failed to create purchase order", error.message);
                    return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                        success: false,
                        message: error.message,
                    });
                }
                console.log("Failed to create purchase order", error);
                return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    message: "Failed to create purchase order",
                });
            }
        };
        /**
         * @summary Updates an existing purchase order.
         * @description This method handles the update of an existing purchase order. It first validates the provided purchase order ID.
         * It then validates the associated vendor, salesman, and project (if provided) to ensure their existence. Finally, it updates the purchase order in the database with the new data.
         * @param req The Express request object, containing the purchase order ID in `req.params.id` and the `UpdatePurchaseOrderDto` in the body.
         * @param res The Express response object used to send back the result.
         * @param next The Express next function to pass control to the next middleware.
         */
        this.updatePurchaseOrder = async (req, res) => {
            try {
                const id = req.params.id;
                const dto = req.body;
                console.log(dto, "dto");
                console.log(req.body, "req.body");
                if (!this.isValidMongoId(req.params.id)) {
                    return res.status(http_status_1.HTTP_STATUS.BAD_REQUEST).json({
                        success: false,
                        message: "Invalid purchase order id",
                    });
                }
                const existingData = await this.genericFindById(id);
                let quoteDate;
                let expiryDate;
                if (req.body.purchaseOrderDate) {
                    quoteDate = new Date(req.body.purchaseOrderDate);
                }
                if (req.body.expDate) {
                    expiryDate = new Date(req.body.expDate);
                }
                if (expiryDate && quoteDate && expiryDate <= quoteDate) {
                    res.status(http_status_1.HTTP_STATUS.BAD_REQUEST).json({
                        success: false,
                        message: "Expiry date must be greater than quote date",
                    });
                }
                if (req.body.vendorId) {
                    await this.validateVendor(req.body.vendorId);
                }
                if (req.body.salesPersonId) {
                    await this.validateSalesman(req.body.salesPersonId);
                }
                if (req.body.projectId) {
                    await this.validateProject(req.body.projectId);
                }
                if (dto.paymentTermsId) {
                    await this.validatePaymenetTerms(dto.paymentTermsId);
                }
                const items = this.mapItems(req.body.items || []);
                const payload = {
                    ...dto,
                    purchaseOrderId: dto.purchaseOrderId ? dto.purchaseOrderId : undefined,
                    vendorId: req.body.vendorId
                        ? new mongoose_1.Types.ObjectId(req.body.vendorId)
                        : undefined,
                    quote: req.body.quote,
                    purchaseOrderDate: quoteDate,
                    expDate: expiryDate,
                    salesPersonId: req.body.salesPersonId
                        ? new mongoose_1.Types.ObjectId(req.body.salesPersonId)
                        : undefined,
                    projectId: req.body.projectId
                        ? new mongoose_1.Types.ObjectId(req.body.projectId)
                        : undefined,
                    items,
                    branchId: dto.branchId ? new mongoose_1.Types.ObjectId(dto.branchId) : undefined,
                    paymentTermsId: req.body.paymentTermsId
                        ? new mongoose_1.Types.ObjectId(req.body.paymentTermsId)
                        : undefined,
                };
                await this.genericUpdateOneById(id, payload);
                return res.status(http_status_1.HTTP_STATUS.OK).json({
                    success: true,
                    message: "Purchase order updated successfully",
                    statusCode: http_status_1.HTTP_STATUS.OK,
                });
            }
            catch (error) {
                if (error instanceof Error) {
                    console.log("Failed to update purchase order", error.message);
                    return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                        success: false,
                        message: error.message,
                    });
                }
                console.log("Failed to update purchase order", error);
                return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    message: "Failed to update purchase order",
                });
            }
        };
        /**
         * @summary Retrieves all purchase orders.
         * @description This method retrieves all purchase orders from the database, with optional filtering by branch ID and search functionality.
         * It also handles pagination and populates related fields like vendor, salesman, and project.
         * @param req The Express request object, which may contain `limit`, `page`, `search`, and `branchId` as query parameters.
         * @param res The Express response object used to send back the result.
         * @param next The Express next function to pass control to the next middleware.
         */
        this.getAllPurchaseOrders = async (req, res, next) => {
            try {
                const authUser = req.user;
                const limit = parseInt(req.query.limit) || 20;
                const page = parseInt(req.query.page) || 1;
                const skip = (page - 1) * limit;
                const search = req.query.search || "";
                const filterBranchId = req.query.branchId;
                const { allowedBranchIds } = await (0, branch_access_helper_1.resolveUserAndAllowedBranchIds)({
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
                const totalCount = await purchaseOrderModel_1.PurchaseOrderModel.countDocuments(query);
                // console.log('count', totalCount)
                const purchaseOrders = await purchaseOrderModel_1.PurchaseOrderModel.find(query)
                    .sort({ createdAt: -1 })
                    .populate(purchaseOrderModel_1.PurchaseOrderModelConstants.vendorId)
                    .populate({
                    path: purchaseOrderModel_1.PurchaseOrderModelConstants.salesPersonId,
                    select: "name email",
                })
                    .populate(purchaseOrderModel_1.PurchaseOrderModelConstants.projectId)
                    .skip(skip)
                    .limit(limit);
                res.status(http_status_1.HTTP_STATUS.OK).json({
                    success: true,
                    data: purchaseOrders,
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
         * @summary Retrieves a single purchase order by ID.
         * @description This method retrieves a single purchase order by its ID from the database.
         * It first validates the purchase order ID, then fetches the purchase order along with its related vendor, salesman, and project details.
         * @param req The Express request object, containing the purchase order ID in `req.params.id`.
         * @param res The Express response object used to send back the result.
         * @param next The Express next function to pass control to the next middleware.
         */
        this.getPurchaseOrderById = async (req, res) => {
            try {
                const { id } = req.params;
                if (!this.isValidMongoId(id)) {
                    return res.status(http_status_1.HTTP_STATUS.BAD_REQUEST).json({
                        success: false,
                        message: "Invalid purchase order id",
                    });
                }
                const purchaseOrder = await purchaseOrderModel_1.PurchaseOrderModel.findOne({
                    _id: id,
                    isDeleted: false,
                })
                    .populate(purchaseOrderModel_1.PurchaseOrderModelConstants.vendorId)
                    .populate({
                    path: purchaseOrderModel_1.PurchaseOrderModelConstants.salesPersonId,
                    select: "username email",
                })
                    .populate(purchaseOrderModel_1.PurchaseOrderModelConstants.projectId)
                    .populate({
                    path: purchaseOrderModel_1.PurchaseOrderModelConstants.branchId,
                    select: "branchName city email phone",
                });
                if (!purchaseOrder) {
                    return res.status(http_status_1.HTTP_STATUS.NOT_FOUND).json({
                        success: false,
                        message: "Purchase order not found",
                    });
                }
                let paymentTerm = null;
                if (purchaseOrder.paymentTermsId &&
                    mongoose_1.default.Types.ObjectId.isValid(purchaseOrder.paymentTermsId.toString())) {
                    const paymentTermsDoc = await this.paymentTermsModel.findOne({
                        "terms._id": purchaseOrder.paymentTermsId,
                    }, {
                        "terms.$": 1,
                    });
                    paymentTerm = paymentTermsDoc?.terms?.[0] || null;
                }
                return res.status(http_status_1.HTTP_STATUS.OK).json({
                    success: true,
                    data: {
                        ...purchaseOrder.toObject(),
                        paymentTerm,
                    },
                });
            }
            catch (error) {
                console.error("Failed to get purchase order", error);
                return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    message: error instanceof Error
                        ? error.message
                        : "Failed to get purchase order",
                });
            }
        };
        /*  @summary Deletes a purchase order by ID.
         * @description This method deletes a purchase order by its ID from the database.
         * It first validates the purchase order ID, then updates the record to mark it as deleted.
         * @param req The Express request object, containing the purchase order ID in `req.params.id`.
         * @param res The Express response object used to send back the result.
         * @param next The Express next function to pass control to the next middleware.
         */
        this.deletePurchaseOrder = async (req, res) => {
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
                    console.error("Failed to delete purchase order", error.message);
                    return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                        success: false,
                        message: error.message,
                    });
                }
                console.log("Failed to delete purchase order", error);
                return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    message: "Failed to delete purchase order",
                    statusCode: http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR,
                });
            }
        };
        this.vendorModel = vendorModel;
        this.userModel = userModel;
        this.projectModel = projectModel;
        this.branchModel = branchModel;
        this.salesModel = salesPerson_1.default;
        this.paymentTermsModel = paymentTermsModel;
    }
    // Helper methods for validations
    async validateVendor(vendorId) {
        const vendor = await this.vendorModel.findOne({
            _id: vendorId,
            isDeleted: false,
        });
        if (!vendor)
            throw new Error("Vendor not found");
    }
    async validateSalesman(id) {
        const user = await this.salesModel.findOne({
            _id: id,
            isDeleted: false,
        });
        if (!user)
            throw new Error("Salesman not found");
        return user;
    }
    async validateProject(projectId) {
        const project = await this.projectModel.findOne({
            _id: projectId,
            isDeleted: false,
        });
        if (!project)
            throw new Error("Project not found");
    }
    async validatePaymenetTerms(paymentTermsId) {
        if (!this.isValidMongoId(paymentTermsId))
            throw new Error("Invalid payment terms id");
        const paymentTerms = await this.paymentTermsModel.findOne({
            "terms._id": new mongoose_1.default.Types.ObjectId(paymentTermsId),
        });
        if (!paymentTerms)
            throw new Error("Payment terms not found");
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
exports.default = new PurchaseOrderController(vendor_1.default, user_1.default, project_1.default, branch_1.default, salesPerson_1.default, paymentTerms_1.default);
