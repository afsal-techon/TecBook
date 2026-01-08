"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentMadeController = void 0;
const mongoose_1 = require("mongoose");
const GenericDatabase_1 = require("../../Helper/GenericDatabase");
const payment_made_Model_1 = __importDefault(require("../../models/payment-made.Model"));
const user_1 = __importDefault(require("../../models/user"));
const http_status_1 = require("../../constants/http-status");
const vendor_1 = __importDefault(require("../../models/vendor"));
const branch_1 = __importDefault(require("../../models/branch"));
const paymentMode_1 = __importDefault(require("../../models/paymentMode"));
const accounts_1 = __importDefault(require("../../models/accounts"));
const branch_access_helper_1 = require("../../Helper/branch-access.helper");
const imageKit_1 = require("../../config/imageKit");
const BillingRecordsModel_1 = require("../../models/BillingRecordsModel");
const enum_types_1 = require("../../types/enum.types");
const billing_records_controller_1 = __importDefault(require("../billingController/billing-records.controller"));
class PaymentMadeController extends GenericDatabase_1.GenericDatabaseService {
    constructor(userModel, vendorModel, branchModel, paymentModeModel, accountModel, billingModel) {
        super(payment_made_Model_1.default);
        this.billingRecordService = billing_records_controller_1.default;
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
        this.createPaymentMade = async (req, res) => {
            try {
                const dto = req.body;
                const userId = req.user?.id;
                console.log("userId", userId);
                console.log("dto", dto);
                await this.validateUser(userId);
                if (dto.vendorId)
                    await this.validateVendor(dto.vendorId);
                if (dto.branchId)
                    await this.validateBranch(dto.branchId);
                if (dto.accountId)
                    await this.validateAccount(dto.accountId);
                let billingRecord = null;
                if (dto.billId) {
                    const validateBillingRecord = await this.validateBill(dto.billId);
                    billingRecord = validateBillingRecord;
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
                    vendorId: new mongoose_1.Types.ObjectId(dto.vendorId),
                    branchId: new mongoose_1.Types.ObjectId(dto.branchId),
                    accountId: new mongoose_1.Types.ObjectId(dto.accountId),
                    isDeleted: false,
                    date: new Date(dto.date),
                    documents: uploadedFiles,
                    billId: dto.billId ? new mongoose_1.Types.ObjectId(dto.billId) : undefined,
                };
                if (billingRecord &&
                    billingRecord._id &&
                    dto.status === enum_types_1.commonStatus.PAID &&
                    typeof dto.amount === "number") {
                    let finalStatus;
                    if (dto.amount >= billingRecord.total) {
                        finalStatus = enum_types_1.BillingRecordsStatus.PAID;
                    }
                    else if (dto.amount > 0 && dto.amount < billingRecord.total) {
                        finalStatus = enum_types_1.BillingRecordsStatus.PARTIALLY_PAID;
                    }
                    else {
                        return;
                    }
                    await this.billingRecordService.genericUpdateOneById(billingRecord._id.toString(), {
                        status: finalStatus,
                    });
                }
                await this.genericCreateOne(payload);
                return res.status(http_status_1.HTTP_STATUS.CREATED).json({
                    success: true,
                    message: "Payment made created successfully",
                    statusCode: http_status_1.HTTP_STATUS.CREATED,
                });
            }
            catch (error) {
                if (error instanceof Error) {
                    console.log("Error while creating payment made", error.message);
                    return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                        success: false,
                        message: error.message,
                    });
                }
                console.log("Error while creating payment made", error);
                return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    message: "Failed to create payment made",
                });
            }
        };
        /**
         * Updates an existing payment made record.
         * @description This method handles updating an existing payment made record by its ID. It performs several validation checks:
         * - Validates the existence of the specified payment made record.
         * - Ensures a user is authenticated.
         * - Validates the existence of the specified Vendor, Branch, Payment Mode, and Account if they are provided in the update DTO.   * - Constructs and updates the payment made document in the database.
         * @param req The Express request object, containing the payment made ID in `req.params.id` and the `UpdatePaymentMadeDto` in the body.
         * @param res The Express response object used to send back the result.
         * @returns A Promise that resolves to void. Sends a JSON response with HTTP 200 (OK) on successful update.
         * @throws {Error} Throws an error if validation fails or if the database operation fails.
         */
        this.updatePaymentMadeByID = async (req, res) => {
            try {
                const id = req.params.id;
                const result = await this.genericFindOneByIdOrNotFound(id);
                const dto = req.body;
                const userId = req.user?.id;
                await this.validateUser(userId);
                if (dto.vendorId)
                    await this.validateVendor(dto.vendorId);
                if (dto.branchId)
                    await this.validateBranch(dto.branchId);
                if (dto.accountId)
                    await this.validateAccount(dto.accountId);
                let billingRecord = null;
                if (dto.billId) {
                    billingRecord = await this.validateBill(dto.billId);
                }
                if (billingRecord &&
                    billingRecord._id &&
                    dto.status === enum_types_1.commonStatus.PAID &&
                    typeof dto.amount === "number") {
                    let finalStatus = null;
                    if (dto.amount >= billingRecord.total) {
                        finalStatus = enum_types_1.BillingRecordsStatus.PAID;
                    }
                    else if (dto.amount > 0 && dto.amount < billingRecord.total) {
                        finalStatus = enum_types_1.BillingRecordsStatus.PARTIALLY_PAID;
                    }
                    if (finalStatus) {
                        await this.billingRecordService.genericUpdateOneById(billingRecord._id.toString(), { status: finalStatus });
                    }
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
                const paymentMadeModel = result.data;
                const existingPaymentMade = (await paymentMadeModel.findById(id));
                const updatedPayload = {
                    ...dto,
                    vendorId: dto.vendorId ? new mongoose_1.Types.ObjectId(dto.vendorId) : undefined,
                    branchId: existingPaymentMade.branchId,
                    accountId: dto.accountId
                        ? new mongoose_1.Types.ObjectId(dto.accountId)
                        : undefined,
                    date: dto.date ? new Date(dto.date) : undefined,
                    documents: finalDocuments,
                    billId: dto.billId ? new mongoose_1.Types.ObjectId(dto.billId) : undefined,
                };
                await this.genericUpdateOneById(id, updatedPayload);
                return res.status(http_status_1.HTTP_STATUS.OK).json({
                    success: true,
                    message: "Payment made updated successfully",
                    statusCode: http_status_1.HTTP_STATUS.OK,
                });
            }
            catch (error) {
                if (error instanceof Error) {
                    console.log("Error while updating payment made", error.message);
                    return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).jsonp({
                        success: false,
                        message: error.message,
                    });
                }
                console.log("Error while updating payment made", error);
                return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).jsonp({
                    success: false,
                    message: "Failed to update payment made",
                });
            }
        };
        this.getSinglePaymentMadeDataById = async (req, res) => {
            try {
                const id = req.params.id;
                await this.genericFindOneByIdOrNotFound(id);
                const paymentMade = await payment_made_Model_1.default.aggregate([
                    {
                        $match: {
                            _id: new mongoose_1.Types.ObjectId(id),
                            isDeleted: false,
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
                    {
                        $unwind: {
                            path: "$vendor",
                            preserveNullAndEmptyArrays: true,
                        },
                    },
                    {
                        $lookup: {
                            from: "accounts",
                            localField: "accountId",
                            foreignField: "_id",
                            as: "account",
                        },
                    },
                    {
                        $lookup: {
                            from: "branches",
                            localField: "branchId",
                            foreignField: "_id",
                            as: "branch",
                        },
                    },
                    {
                        $unwind: {
                            path: "$branch",
                            preserveNullAndEmptyArrays: true,
                        },
                    },
                    {
                        $unwind: {
                            path: "$account",
                            preserveNullAndEmptyArrays: true,
                        },
                    },
                    {
                        $lookup: {
                            from: "paymentmodes",
                            let: { paymentModeName: "$paymentMode" },
                            pipeline: [
                                { $unwind: "$paymentModes" },
                                {
                                    $match: {
                                        $expr: {
                                            $eq: ["$paymentModes.paymentMode", "$$paymentModeName"],
                                        },
                                    },
                                },
                                {
                                    $project: {
                                        _id: "$paymentModes._id",
                                        paymentMode: "$paymentModes.paymentMode",
                                    },
                                },
                                { $limit: 1 },
                            ],
                            as: "paymentMode",
                        },
                    },
                    {
                        $addFields: {
                            paymentMode: { $arrayElemAt: ["$paymentMode", 0] },
                        },
                    },
                    {
                        $unwind: {
                            path: "$paymentMode",
                            preserveNullAndEmptyArrays: true,
                        },
                    },
                    {
                        $project: {
                            "vendor._id": 1,
                            "vendor.name": 1,
                            amount: 1,
                            date: 1,
                            bankCharge: 1,
                            paymentId: 1,
                            note: 1,
                            "account._id": 1,
                            "account.accountName": 1,
                            "paymentMode._id": 1,
                            "paymentMode.paymentMode": 1,
                            status: 1,
                            "branch._id": 1,
                            "branch.branchName": 1,
                            "branch.city": 1,
                            "branch.address": 1,
                            "branch.email": 1,
                            "branch.phone": 1,
                        },
                    },
                ]);
                const finalOutput = paymentMade[0] || null;
                return res.status(http_status_1.HTTP_STATUS.OK).json({
                    success: true,
                    data: finalOutput,
                    statusCode: http_status_1.HTTP_STATUS.OK,
                });
            }
            catch (error) {
                if (error instanceof Error) {
                    console.log("Error while getting single payment made data by id", error.message);
                    return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                        success: false,
                        message: error.message,
                    });
                }
                console.log("Error while getting single payment made data by id", error);
                return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    message: "Failed to get single payment made data by id",
                });
            }
        };
        /*  * Get all payment made data with pagination and search functionality.
         * @description This method retrieves all payment made records from the database, with optional filtering by branch ID and search functionality.
         * It also handles pagination and populates related fields like vendor, account, and payment mode.
         * @param req The Express request object, which may contain `limit`, `page`, `search`, and `branchId` as query parameters.
         * @param res The Express response object used to send back the result.
         * @returns A Promise that resolves to void. Sends a JSON response with HTTP 200 (OK) on success.
         * @throws {Error} Throws an error if the database query fails or permission resolution encounters issues.
         */
        this.getAllPaymentMadeData = async (req, res) => {
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
                const pipeline = [
                    {
                        $match: {
                            isDeleted: false,
                            ...(allowedBranchIds.length && {
                                branchId: {
                                    $in: allowedBranchIds.map((id) => new mongoose_1.Types.ObjectId(id)),
                                },
                            }),
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
                    {
                        $lookup: {
                            from: "accounts",
                            localField: "accountId",
                            foreignField: "_id",
                            as: "account",
                        },
                    },
                    { $unwind: { path: "$account", preserveNullAndEmptyArrays: true } },
                    {
                        $lookup: {
                            from: "paymentmodes",
                            let: { paymentModeName: "$paymentMode" },
                            pipeline: [
                                { $unwind: "$paymentModes" },
                                {
                                    $match: {
                                        $expr: {
                                            $eq: ["$paymentModes.paymentMode", "$$paymentModeName"],
                                        },
                                    },
                                },
                                {
                                    $project: {
                                        _id: "$paymentModes._id",
                                        paymentMode: "$paymentModes.paymentMode",
                                    },
                                },
                                { $limit: 1 },
                            ],
                            as: "paymentMode",
                        },
                    },
                    {
                        $addFields: {
                            paymentMode: { $arrayElemAt: ["$paymentMode", 0] },
                        },
                    },
                    { $unwind: { path: "$paymentMode", preserveNullAndEmptyArrays: true } },
                    ...(search
                        ? [
                            {
                                $match: {
                                    $or: [
                                        { paymentId: { $regex: search, $options: "i" } },
                                        { "vendor.name": { $regex: search, $options: "i" } },
                                        {
                                            "account.accountName": { $regex: search, $options: "i" },
                                        },
                                        {
                                            "paymentMode.paymentMode": {
                                                $regex: search,
                                                $options: "i",
                                            },
                                        },
                                    ],
                                },
                            },
                        ]
                        : []),
                    { $sort: { createdAt: -1 } },
                    {
                        $facet: {
                            data: [
                                { $skip: skip },
                                { $limit: limit },
                                {
                                    $project: {
                                        _id: 1,
                                        amount: 1,
                                        date: 1,
                                        bankCharge: 1,
                                        paymentId: 1,
                                        "vendor._id": 1,
                                        "vendor.name": 1,
                                        "account._id": 1,
                                        "account.accountName": 1,
                                        "paymentMode._id": 1,
                                        "paymentMode.paymentMode": 1,
                                        status: 1,
                                    },
                                },
                            ],
                            totalCount: [{ $count: "count" }],
                        },
                    },
                ];
                const result = await payment_made_Model_1.default.aggregate(pipeline);
                const paymentMade = result[0]?.data || [];
                const totalCount = result[0]?.totalCount[0]?.count || 0;
                return res.status(http_status_1.HTTP_STATUS.OK).json({
                    success: true,
                    data: paymentMade,
                    statusCode: http_status_1.HTTP_STATUS.OK,
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
                    console.log("Error while getting all payment made data", error.message);
                    return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                        success: false,
                        message: error.message,
                    });
                }
                console.log("Error while getting all payment made data", error);
                return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    message: "Failed to get all payment made data",
                });
            }
        };
        this.deletePaymentMadeById = async (req, res) => {
            try {
                const id = req.params.id;
                await this.genericFindOneByIdOrNotFound(id);
                const userId = req.user?.id;
                await this.validateUser(userId);
                await this.genericDeleteOneById(id);
                return res.status(http_status_1.HTTP_STATUS.OK).json({
                    status: res.status,
                    message: "Payment made deleted successfully",
                    statusCode: res.statusCode,
                });
            }
            catch (error) {
                if (error instanceof Error) {
                    console.log("Error while deleting payment made", error.message);
                    return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                        success: false,
                        message: error.message,
                    });
                }
                console.log("Error while deleting payment made", error);
                return res.status(http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    message: "Failed to delete payment made",
                    statusCode: http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR,
                });
            }
        };
        this.userModel = userModel;
        this.vendorModel = vendorModel;
        this.branchModel = branchModel;
        this.paymentModeModel = paymentModeModel;
        this.accountModel = accountModel;
        this.billingModel = BillingRecordsModel_1.BillingSchemaModel;
    }
    async validateUser(id) {
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
    async validateVendor(vendorId) {
        if (!this.isValidMongoId(vendorId)) {
            throw new Error("Invalid vendor ID");
        }
        const vendor = await this.vendorModel.findOne({
            _id: vendorId,
            isDeleted: false,
        });
        if (!vendor)
            throw new Error("Vendor not found");
        return vendor;
    }
    async validateBranch(id) {
        if (!this.isValidMongoId(id)) {
            throw new Error("Invalid branch ID");
        }
        const branch = await this.branchModel.findOne({
            _id: id,
            isDeleted: false,
        });
        if (!branch)
            throw new Error("Branch not found");
        return branch;
    }
    async validateAccount(id) {
        if (!this.isValidMongoId(id)) {
            throw new Error("Invalid account ID");
        }
        const account = await this.accountModel.findOne({
            _id: id,
            isDeleted: false,
        });
        if (!account)
            throw new Error("Account not found");
        return account;
    }
    async validateBill(id) {
        if (!this.isValidMongoId(id)) {
            throw new Error("Invalid bill ID");
        }
        const validate = await this.billingModel.findById(id, { isDeleted: false });
        if (!validate)
            throw new Error("Bill not found");
        return validate;
    }
}
exports.paymentMadeController = new PaymentMadeController(user_1.default, vendor_1.default, branch_1.default, paymentMode_1.default, accounts_1.default, BillingRecordsModel_1.BillingSchemaModel);
