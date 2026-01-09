"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountTypeController = exports.AccountType = void 0;
const default_account_types_constant_1 = require("../../constants/default-account-types.constant");
const default_account_constant_1 = require("../../constants/default-account.constant");
const GenericDatabase_1 = require("../../Helper/GenericDatabase");
const account_types_model_1 = require("../../models/account-types.model");
const accounts_1 = __importDefault(require("../../models/accounts"));
const user_1 = __importDefault(require("../../models/user"));
class AccountType extends GenericDatabase_1.GenericDatabaseService {
    constructor(accountModel) {
        super(account_types_model_1.accountTypeModel);
        /*  * Auto create common account types
         ----------------------------------
         This method checks for the existence of common account types and creates them if they don't exist.
         * It relies on `DEFAULT_ACCOUNT_TYPES` constant.
         * @returns A success message or an error message.
         */
        this.autoCreateCommonAccountTypes = async () => {
            try {
                for (const accountType of default_account_types_constant_1.DEFAULT_ACCOUNT_TYPES) {
                    const existAccountType = await this.genericFindOne({
                        name: accountType.name,
                        category: accountType.category,
                        isDeleted: false,
                        isSystemGenerated: true,
                    });
                    if (!existAccountType) {
                        await this.genericCreateOne(accountType);
                    }
                }
                return {
                    success: true,
                    message: "Default account types seeded successfully",
                };
            }
            catch (error) {
                if (error instanceof Error) {
                    console.log("Failed to create common account types", error.message);
                    return error.message;
                }
                console.log("Failed to create common account types", error);
                return "Failed to create common account types";
            }
        };
        /*  * Auto create system default accounts
         ----------------------------------
         This method checks for the existence of system default accounts and creates them if they don't exist.
         * It relies on `DEFAULT_ACCOUNTS` constant and `accountTypeModel` to link accounts to their types.
         * @returns A success message or an error message.
         */
        this.autoCreateCommonAccounts = async () => {
            try {
                for (const account of default_account_constant_1.DEFAULT_ACCOUNTS) {
                    if (!account.accountName || !account.accountTypeName)
                        continue;
                    const accountType = await account_types_model_1.accountTypeModel.findOne({
                        name: account.accountTypeName,
                        isDeleted: false,
                        isSystemGenerated: true,
                    });
                    if (!accountType) {
                        console.warn(`⚠️ AccountType not found: ${account.accountTypeName}`);
                        continue;
                    }
                    const existingAccount = await this.genericFindOne({
                        accountName: account.accountName,
                        accountType: accountType._id,
                        isDeleted: false,
                        isSystemGenerated: true,
                    });
                    if (existingAccount)
                        continue;
                    await this.accountModel.create({
                        accountName: account.accountName,
                        accountType: accountType._id,
                        isSystemGenerated: true,
                    });
                }
                return {
                    success: true,
                    message: "System default accounts created successfully",
                };
            }
            catch (error) {
                if (error instanceof Error) {
                    console.error("Failed to create system accounts", error.message);
                    return error.message;
                }
                console.error("Failed to create system accounts", error);
                return "Failed to create system accounts";
            }
        };
        /*  * List all account types with optional pagination and search
         ----------------------------------
         This method lists all account types with optional pagination and search.
         * @param req The Express request object.
         * @param res The Express response object.
         * @returns A JSON response with the list of account types or an error message.
         */
        this.listAllAccountTypes = async (req, res) => {
            try {
                const userId = req.user?.id;
                const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
                if (!user) {
                    return res.status(400).json({
                        success: false,
                        message: "User not found!",
                    });
                }
                const search = (req.query.search || "").trim();
                const paginate = req.query.paginate !== "false";
                const page = paginate ? Math.max(Number(req.query.page) || 1, 1) : 1;
                const limit = paginate ? Math.max(Number(req.query.limit) || 10, 1) : 10;
                const skip = paginate ? (page - 1) * limit : 0;
                const matchStage = {
                    isDeleted: false,
                };
                if (search) {
                    matchStage.name = { $regex: search, $options: "i" };
                }
                const projectStage = paginate
                    ? {
                        _id: 1,
                        name: 1,
                        category: 1,
                        isSystemGenerated: 1,
                        createdAt: 1,
                        updatedAt: 1,
                    }
                    : {
                        _id: 1,
                        name: 1,
                        category: 1,
                        isSystemGenerated: 1,
                    };
                const pipeline = [
                    { $match: matchStage },
                    { $project: projectStage },
                    { $sort: { createdAt: -1 } },
                ];
                if (paginate) {
                    pipeline.push({ $skip: skip }, { $limit: limit });
                }
                const accountTypes = await account_types_model_1.accountTypeModel.aggregate(pipeline);
                const totalCount = await account_types_model_1.accountTypeModel.countDocuments(matchStage);
                return res.status(200).json({
                    success: true,
                    data: accountTypes,
                    totalCount,
                    page,
                    limit,
                });
            }
            catch (error) {
                if (error instanceof Error) {
                    console.error("Error while listing account types:", error.message);
                    return res.status(500).json({
                        success: false,
                        message: error.message,
                    });
                }
                console.error("Unknown error while listing account types:", error);
                return res.status(500).json({
                    success: false,
                    message: "Something went wrong",
                });
            }
        };
        this.accountModel = accountModel;
    }
}
exports.AccountType = AccountType;
exports.accountTypeController = new AccountType(accounts_1.default);
