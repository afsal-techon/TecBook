"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const GenericDatabase_1 = require("../../Helper/GenericDatabase");
const purchaseOrderModel_1 = require("../../models/purchaseOrderModel");
const vendor_1 = __importDefault(require("../../models/vendor"));
const user_1 = __importDefault(require("../../models/user"));
const project_1 = __importDefault(require("../../models/project"));
const http_status_1 = require("../../constants/http-status");
const branch_1 = __importDefault(require("../../models/branch"));
const branch_access_helper_1 = require("../../Helper/branch-access.helper");
class PurchaseOrderController extends GenericDatabase_1.GenericDatabaseService {
    constructor(vendorModel, userModel, projectModel, branchModel) {
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
        this.createPurchaseOrder = async (req, res, next) => {
            try {
                const dto = req.body;
                const userId = req.user?.id;
                if (!userId) {
                    return res.status(http_status_1.HTTP_STATUS.UNAUTHORIZED).json({
                        success: false,
                        message: "Unauthorized",
                    });
                }
                const quoteDate = new Date(dto.quoteDate);
                const expiryDate = new Date(dto.expiryDate);
                if (expiryDate < quoteDate) {
                    return res.status(http_status_1.HTTP_STATUS.BAD_REQUEST).json({
                        success: false,
                        message: "Expiry date must be greater than quote date",
                    });
                }
                await this.validateVendor(dto.vendorId);
                await this.validateSalesman(dto.salesmanId);
                if (dto.projectId)
                    await this.validateProject(dto.projectId);
                const items = this.mapItems(dto.items);
                const payload = {
                    vendorId: new mongoose_1.Types.ObjectId(dto.vendorId),
                    purchaseOrderNumber: 91, //TODO : move to auto increment
                    quoteNumber: dto.quoteNumber,
                    quoteDate,
                    expiryDate,
                    salesmanId: new mongoose_1.Types.ObjectId(dto.salesmanId),
                    projectId: dto.projectId
                        ? new mongoose_1.Types.ObjectId(dto.projectId)
                        : undefined,
                    items,
                    createdBy: new mongoose_1.Types.ObjectId(userId) ?? undefined,
                    branchId: new mongoose_1.Types.ObjectId(dto.branchId),
                };
                const purchaseOrder = await this.genericCreateOne(payload);
                res.status(http_status_1.HTTP_STATUS.CREATED).json({
                    success: true,
                    message: "Purchase order created successfully",
                    data: purchaseOrder,
                });
            }
            catch (error) {
                next(error);
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
        this.updatePurchaseOrder = async (req, res, next) => {
            try {
                const id = req.params.id;
                if (!this.isValidMongoId(req.params.id)) {
                    return res.status(http_status_1.HTTP_STATUS.BAD_REQUEST).json({
                        success: false,
                        message: "Invalid purchase order id",
                    });
                }
                let quoteDate;
                let expiryDate;
                if (req.body.quoteDate) {
                    quoteDate = new Date(req.body.quoteDate);
                }
                if (req.body.expiryDate) {
                    expiryDate = new Date(req.body.expiryDate);
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
                if (req.body.salesmanId) {
                    await this.validateSalesman(req.body.salesmanId);
                }
                if (req.body.projectId) {
                    await this.validateProject(req.body.projectId);
                }
                const items = this.mapItems(req.body.items || []);
                const payload = {
                    vendorId: req.body.vendorId
                        ? new mongoose_1.Types.ObjectId(req.body.vendorId)
                        : undefined,
                    quoteNumber: req.body.quoteNumber,
                    quoteDate,
                    expiryDate,
                    salesmanId: req.body.salesmanId
                        ? new mongoose_1.Types.ObjectId(req.body.salesmanId)
                        : undefined,
                    projectId: req.body.projectId
                        ? new mongoose_1.Types.ObjectId(req.body.projectId)
                        : undefined,
                    items,
                };
                await this.genericUpdateOneById(id, payload);
                return res.status(http_status_1.HTTP_STATUS.OK).json({
                    success: true,
                    message: "Purchase order updated successfully",
                    statusCode: http_status_1.HTTP_STATUS.OK,
                });
            }
            catch (error) {
                next(error);
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
                const totalCount = await purchaseOrderModel_1.PurchaseOrderModel.countDocuments(query);
                // console.log('count', totalCount)
                const purchaseOrders = await purchaseOrderModel_1.PurchaseOrderModel.find(query)
                    .sort({ createdAt: -1 })
                    .populate(purchaseOrderModel_1.PurchaseOrderModelConstants.vendorId)
                    .populate({
                    path: purchaseOrderModel_1.PurchaseOrderModelConstants.salesmanId,
                    select: "username email",
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
        this.getPurchaseOrderById = async (req, res, next) => {
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
                    path: purchaseOrderModel_1.PurchaseOrderModelConstants.salesmanId,
                    select: "username email",
                })
                    .populate(purchaseOrderModel_1.PurchaseOrderModelConstants.projectId);
                if (!purchaseOrder) {
                    return res.status(http_status_1.HTTP_STATUS.NOT_FOUND).json({
                        success: false,
                        message: "Purchase order not found",
                    });
                }
                res.status(http_status_1.HTTP_STATUS.OK).json({
                    success: true,
                    data: purchaseOrder,
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.vendorModel = vendorModel;
        this.userModel = userModel;
        this.projectModel = projectModel;
        this.branchModel = branchModel;
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
    async validateSalesman(userId) {
        const user = await this.userModel.findOne({
            _id: userId,
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
    mapItems(itemsDto) {
        return itemsDto.map((item) => ({
            itemId: item.itemId ? new mongoose_1.Types.ObjectId(item.itemId) : undefined,
            taxId: item.taxId ? new mongoose_1.Types.ObjectId(item.taxId) : undefined,
            itemName: item.itemName,
            qty: item.qty,
            tax: item.tax,
            rate: item.rate,
            amount: item.amount,
            unit: item.unit,
            discount: item.discount,
        }));
    }
}
exports.default = new PurchaseOrderController(vendor_1.default, user_1.default, project_1.default, branch_1.default);
