"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expenseController = void 0;
const mongoose_1 = require("mongoose");
const GenericDatabase_1 = require("../../Helper/GenericDatabase");
const ExpenseModel_1 = require("../../models/ExpenseModel");
const user_1 = __importDefault(require("../../models/user"));
const branch_1 = __importDefault(require("../../models/branch"));
const vendor_1 = __importDefault(require("../../models/vendor"));
const http_status_1 = require("../../constants/http-status");
const branch_access_helper_1 = require("../../Helper/branch-access.helper");
const customer_1 = __importDefault(require("../../models/customer"));
const imageKit_1 = require("../../config/imageKit");
class ExpenseController extends GenericDatabase_1.GenericDatabaseService {
    constructor() {
        super(ExpenseModel_1.ExpenseModel);
        /**
         * Creates a new expense record in the database.
         *
         * This method performs the following operations:
         * 1. Validates the authenticated user's ID from the request.
         * 2. Validates the existence of the User, Vendor, Branch, and Customer entities.
         * 3. Maps the expense items from the DTO to the internal item structure.
         * 4. Persists the new expense entry.
         *
         * @param req - The Express Request object. Expects `CreateExpenseDto` in `req.body` and an authenticated user in `req.user`.
         * @param res - The Express Response object.
         * @returns A Promise that resolves to void. Sends a JSON response with:
         *          - HTTP 201 (Created) and the expense data on success.
         *          - HTTP 401 (Unauthorized) if the user is not authenticated.
         *          - HTTP 400 (Bad Request) if the user ID is invalid.
         * @throws {Error} Throws an error if validation of related entities fails or if the database operation encounters an issue.
         */
        this.createExpense = async (req, res) => {
            try {
                const dto = req.body;
                const userId = req.user?.id;
                if (!userId) {
                    return res.status(http_status_1.HTTP_STATUS.UNAUTHORIZED).json({
                        success: false,
                        message: "Unauthorized",
                    });
                }
                if (!this.isValidMongoId(userId)) {
                    return res.status(http_status_1.HTTP_STATUS.BAD_REQUEST).json({
                        success: false,
                        message: "Invalid user id",
                    });
                }
                await this.validateUser(userId);
                await this.validateVendor(dto.vendorId);
                await this.validateBranch(dto.branchId);
                await this.validateCustomer(dto.customerId);
                const items = this.mapItems(dto.items);
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
                    date: dto.date ? new Date(dto.date) : new Date(),
                    expenseNumber: dto.expenseNumber,
                    customerId: new mongoose_1.Types.ObjectId(dto.customerId),
                    branchId: new mongoose_1.Types.ObjectId(dto.branchId),
                    taxPreference: dto.taxPreference,
                    paidAccount: new mongoose_1.Types.ObjectId(dto.paidAccount),
                    vendorId: new mongoose_1.Types.ObjectId(dto.vendorId),
                    items,
                    createdBy: new mongoose_1.Types.ObjectId(userId),
                    documents: uploadedFiles,
                };
                const expense = await this.genericCreateOne(payload);
                res.status(http_status_1.HTTP_STATUS.CREATED).json({
                    success: true,
                    message: "Expense created successfully",
                    data: expense,
                });
            }
            catch (error) {
                if (error instanceof Error) {
                    console.log("Error while creating expense", error.message);
                    return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                        success: false,
                        message: error.message,
                    });
                }
                console.log("Error while creating expense", error);
                return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    message: "failed to create expense",
                });
            }
        };
        /**
         * Updates an existing expense record by ID.
         *
         * This method performs the following operations:
         * 1. Verifies the existence of the expense record using the provided ID.
         * 2. Validates related entities (Vendor, Branch, Customer) if their IDs are provided in the update payload.
         * 3. Maps updated items to the internal item structure if provided.
         * 4. Updates the expense record in the database with the new values.
         *
         * @param req - The Express Request object. Expects the expense ID in `req.params.id` and partial expense details in `req.body`.
         * @param res - The Express Response object.
         * @param next - The Express NextFunction.
         * @returns A Promise that resolves to void. Sends a JSON response with HTTP 200 (OK) on success.
         * @throws {Error} Throws an error if validation fails or if the database update operation fails.
         */
        this.updateExpense = async (req, res) => {
            try {
                const { id } = req.params;
                const dto = req.body;
                await this.genericFindOneByIdOrNotFound(id);
                if (req.body.vendorId) {
                    await this.validateVendor(req.body.vendorId);
                }
                if (req.body.branchId) {
                    await this.validateBranch(req.body.branchId);
                }
                if (req.body.customerId) {
                    await this.validateCustomer(req.body.customerId);
                }
                const items = req.body.items
                    ? this.mapItems(req.body.items)
                    : [];
                const payload = {
                    ...dto,
                    date: req.body.date ? new Date(req.body.date) : undefined,
                    customerId: req.body.customerId
                        ? new mongoose_1.Types.ObjectId(req.body.customerId)
                        : undefined,
                    branchId: req.body.branchId
                        ? new mongoose_1.Types.ObjectId(req.body.branchId)
                        : undefined,
                    taxPreference: req.body.taxPreference,
                    paidAccount: req.body.paidAccount
                        ? new mongoose_1.Types.ObjectId(req.body.paidAccount)
                        : undefined,
                    vendorId: req.body.vendorId
                        ? new mongoose_1.Types.ObjectId(req.body.vendorId)
                        : undefined,
                    items,
                };
                await this.genericUpdateOneById(id, payload);
                res.status(http_status_1.HTTP_STATUS.OK).json({
                    success: true,
                    message: "Expense updated successfully",
                });
            }
            catch (error) {
                if (error instanceof Error) {
                    console.log("Error while updating expense", error.message);
                    return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                        success: false,
                        message: error.message,
                    });
                }
                console.log("Error while updating expense", error);
                return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    message: "failed to update expense",
                });
            }
        };
        /**
         * Retrieves a paginated list of expenses based on query filters and user permissions.
         *
         * This method performs the following operations:
         * 1. Resolves the authenticated user's allowed branches to ensure data access security.
         * 2. Applies filtering based on the `branchId` query parameter (if provided and allowed).
         * 3. Applies search filtering on `expenseNumber` if a search term is provided.
         * 4. Supports pagination via `page` and `limit` query parameters.
         * 5. Retrieves the expense records from the database, populated with Vendor and Branch details.
         *
         * @param req - The Express Request object. Expects query parameters:
         *              - `page` (optional): Page number (default: 1).
         *              - `limit` (optional): Number of items per page (default: 20).
         *              - `search` (optional): Search term for expense number.
         *              - `branchId` (optional): Filter by specific branch ID.
         * @param res - The Express Response object.
         * @param next - The Express NextFunction.
         * @returns A Promise that resolves to void. Sends a JSON response with:
         *          - `success`: boolean indicating success.
         *          - `data`: Array of expense objects.
         *          - `pagination`: Object containing `totalCount`, `page`, `limit`, and `totalPages`.
         * @throws {Error} Throws an error if the database query fails or permission resolution encounters issues.
         */
        this.getAllExpenses = async (req, res, next) => {
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
                const query = {
                    isDeleted: false,
                    branchId: { $in: allowedBranchIds },
                };
                if (search) {
                    query.expenseNumber = { $regex: search, $options: "i" };
                }
                const totalCount = await ExpenseModel_1.ExpenseModel.countDocuments(query);
                const expenses = await ExpenseModel_1.ExpenseModel.find(query)
                    .sort({ createdAt: -1 })
                    .populate(ExpenseModel_1.ExpenseModelConstants.vendorId)
                    .populate(ExpenseModel_1.ExpenseModelConstants.branchId)
                    .skip(skip)
                    .limit(limit);
                res.status(http_status_1.HTTP_STATUS.OK).json({
                    success: true,
                    data: expenses,
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
                    console.log("Error while getting all expenses", error.message);
                    return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                        success: false,
                        message: error.message,
                    });
                }
                console.log("Error while getting all expenses", error);
                return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    message: "failed to get all expenses",
                });
            }
        };
        /**
         * Retrieves a single expense record by its ID.
         *
         * This method performs the following operations:
         * 1. Validates the provided expense ID format.
         * 2. Checks for the existence of the expense record.
         * 3. Retrieves the expense details, populating Vendor and Branch information.
         *
         * @param req - The Express Request object. Expects the expense ID in `req.params.id`.
         * @param res - The Express Response object.
         * @returns A Promise that resolves to void. Sends a JSON response with:
         *          - HTTP 200 (OK) and the expense object on success.
         *          - HTTP 400 (Bad Request) if the ID format is invalid.
         *          - HTTP 404 (Not Found) if the expense does not exist.
         * @throws {Error} Throws an error if the database query fails.
         */
        this.getExpenseById = async (req, res) => {
            try {
                const { id } = req.params;
                if (!this.isValidMongoId(id)) {
                    return res.status(http_status_1.HTTP_STATUS.BAD_REQUEST).json({
                        success: false,
                        message: "Invalid expense id",
                    });
                }
                await this.genericFindOneByIdOrNotFound(id);
                const expense = await ExpenseModel_1.ExpenseModel.findOne({
                    _id: id,
                    isDeleted: false,
                })
                    .populate(ExpenseModel_1.ExpenseModelConstants.vendorId)
                    .populate(ExpenseModel_1.ExpenseModelConstants.branchId);
                if (!expense) {
                    return res.status(http_status_1.HTTP_STATUS.NOT_FOUND).json({
                        success: false,
                        message: "Expense not found",
                    });
                }
                res.status(http_status_1.HTTP_STATUS.OK).json({
                    success: true,
                    data: expense,
                });
            }
            catch (error) {
                if (error instanceof Error) {
                    console.log("Error while getting expense by id", error.message);
                    return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                        success: false,
                        message: error.message,
                    });
                }
                console.log("Error while getting expense by id", error);
                return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    message: "failed to get expense by id",
                });
            }
        };
        this.userModel = user_1.default;
        this.branchModel = branch_1.default;
        this.vendorModel = vendor_1.default;
        this.customerModel = customer_1.default;
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
    async validateUser(id) {
        const user = await this.userModel.findOne({
            _id: id,
            isDeleted: false,
        });
        if (!user)
            throw new Error("User not found");
        return user;
    }
    async validateVendor(vendorId) {
        const vendor = await this.vendorModel.findOne({
            _id: vendorId,
            isDeleted: false,
        });
        if (!vendor)
            throw new Error("Vendor not found");
        return vendor;
    }
    async validateCustomer(customerId) {
        const customer = await this.customerModel.findOne({
            _id: customerId,
            isDeleted: false,
        });
        if (!customer)
            throw new Error("customer not found");
        return customer;
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
exports.expenseController = new ExpenseController();
