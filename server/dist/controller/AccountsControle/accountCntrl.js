"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAcccount = exports.updateAccount = exports.getAccounts = exports.createAccounts = void 0;
const accounts_1 = __importDefault(require("../../models/accounts"));
const user_1 = __importDefault(require("../../models/user"));
const http_status_1 = require("../../constants/http-status");
const createAccounts = async (req, res, next) => {
    try {
        const { branchId, accountName, accountType, description, parentAccountId } = req.body;
        const userId = req.user?.id;
        // Validate user
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user)
            return res.status(400).json({ message: "User not found!" });
        if (!branchId) {
            return res.status(400).json({ message: "Branch Id is reqruired!" });
        }
        if (!accountType) {
            return res.status(400).json({ message: "Account Type is required!" });
        }
        if (!accountName) {
            return res.status(400).json({ message: "Account name is required!" });
        }
        const existing = await accounts_1.default.findOne({ branchId, accountName, isDeleted: false });
        if (existing) {
            return res.status(400).json({ message: "Account name already exists." });
        }
        if (parentAccountId) {
            const parent = await accounts_1.default.findOne({ _id: parentAccountId, branchId });
            if (!parent) {
                return res.status(400).json({ message: "Parent account not found." });
            }
        }
        await accounts_1.default.create({
            branchId,
            accountName,
            accountType,
            description,
            // openingBalance: parseFloat((openingBalance|| 0).toFixed(2)),
            parentAccountId: parentAccountId || null,
            createdById: user._id,
            //   createdBy:user.name,
        });
        res.status(201).json({
            message: "Account created successfully.",
        });
    }
    catch (err) {
        next(err);
    }
};
exports.createAccounts = createAccounts;
const getAccounts = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        // validate user
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        const userRole = user.role; // "CompanyAdmin" or "User"
        // const filterBranchId = req.query.branchId as string; // optional
        const search = (req.query.search || "").trim();
        // Pagination
        const limit = parseInt(req.query.limit) || 20;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        // 🔹 Determine allowed branches
        // let allowedBranchIds: mongoose.Types.ObjectId[] = [];
        // if (userRole === "CompanyAdmin") {
        //   const branches = await BRANCH.find({
        //     companyAdminId: userId,
        //     isDeleted: false,
        //   }).select("_id");
        //   allowedBranchIds = branches.map(
        //     (b) => new mongoose.Types.ObjectId(b._id as mongoose.Types.ObjectId)
        //   );
        // } else if (userRole === "User") {
        //   if (!user.branchId) {
        //     return res
        //       .status(400)
        //       .json({ message: "User is not assigned to any branch!" });
        //   }
        //   allowedBranchIds = [user.branchId];
        // } else {
        //   return res.status(403).json({ message: "Unauthorized role!" });
        // }
        // 🔹 Apply branch filter if passed
        // if (filterBranchId) {
        //   const filterId = new mongoose.Types.ObjectId(filterBranchId);
        //   if (!allowedBranchIds.some((id) => id.equals(filterId))) {
        //     return res.status(403).json({
        //       message: "You are not authorized to view customers for this branch!",
        //     });
        //   }
        //   allowedBranchIds = [filterId];
        // }
        const match = {
            //  branchId: { $in: allowedBranchIds },
            isDeleted: false,
        };
        // only add search filter when search has value
        if (search.length > 0) {
            match.$or = [
                { accountName: { $regex: search, $options: "i" } },
                { accountType: { $regex: search, $options: "i" } },
            ];
        }
        // pipeline
        const pipeline = [
            { $match: match },
            {
                $lookup: {
                    from: "accounts",
                    localField: "parentAccountId",
                    foreignField: "_id",
                    as: "parentAccount",
                },
            },
            {
                $unwind: {
                    path: "$parentAccount",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "accounttypes",
                    localField: "accountType",
                    foreignField: "_id",
                    as: "accountType",
                },
            },
            {
                $unwind: {
                    path: "$accountType",
                    preserveNullAndEmptyArrays: true,
                },
            }
        ];
        // allow search on parent name too
        if (search.length > 0) {
            pipeline.push({
                $match: {
                    $or: [
                        { accountName: { $regex: search, $options: "i" } },
                        { accountType: { $regex: search, $options: "i" } },
                        { "parentAccount.accountName": { $regex: search, $options: "i" } },
                    ],
                },
            });
        }
        // projection
        pipeline.push({
            $project: {
                _id: 1,
                branchId: 1,
                accountName: 1,
                accountType: 1,
                description: 1,
                createdAt: 1,
                parentAccountId: "$parentAccount._id",
                parentAccountName: "$parentAccount.accountName",
                updatedAt: 1,
                isSystemGenerated: 1
            },
        });
        // sorting & pagination
        pipeline.push({ $sort: { createdAt: -1 } }, { $skip: skip }, { $limit: limit });
        const accounts = await accounts_1.default.aggregate(pipeline);
        // total count for pagination
        const totalCount = await accounts_1.default.countDocuments(match);
        return res.status(200).json({
            data: accounts,
            totalCount,
            page,
            limit,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getAccounts = getAccounts;
const updateAccount = async (req, res, next) => {
    try {
        const { accountId, branchId, accountName, accountType, description, parentAccountId, } = req.body;
        const userId = req.user?.id;
        // validate user
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        if (!accountId) {
            return res.status(400).json({ message: "Account ID is required!" });
        }
        // fetch existing
        const account = await accounts_1.default.findOne({
            _id: accountId,
            isDeleted: false,
        });
        if (!account) {
            return res.status(404).json({ message: "Account not found!" });
        }
        if (!branchId) {
            return res.status(400).json({ message: "Branch Id is required!" });
        }
        if (!accountType) {
            return res.status(400).json({ message: "Account Type is required!" });
        }
        if (!accountName) {
            return res.status(400).json({ message: "Account name is required!" });
        }
        // check duplicate account name (exclude current one)
        const existing = await accounts_1.default.findOne({
            _id: { $ne: accountId },
            branchId,
            accountName,
            isDeleted: false,
        });
        if (existing) {
            return res.status(400).json({ message: "Account name already exists." });
        }
        // validate parent
        if (parentAccountId) {
            const parent = await accounts_1.default.findOne({
                _id: parentAccountId,
                branchId,
                isDeleted: false,
            });
            if (!parent) {
                return res.status(400).json({ message: "Parent account not found." });
            }
            // prevent account setting itself as parent
            if (parentAccountId === accountId) {
                return res.status(400).json({
                    message: "An account cannot be parent of itself.",
                });
            }
        }
        const existBranchId = account.branchId;
        // perform update
        await accounts_1.default.findByIdAndUpdate(accountId, {
            existBranchId,
            accountName,
            accountType,
            description,
            parentAccountId: parentAccountId || null,
            updatedAt: new Date(),
        }, { new: true });
        return res.status(200).json({ message: "Account updated successfully." });
    }
    catch (err) {
        next(err);
    }
};
exports.updateAccount = updateAccount;
const deleteAcccount = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { accountId } = req.params;
        // Validate user
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user)
            return res.status(400).json({ message: "User not found!" });
        if (!accountId) {
            return res.status(400).json({ message: "Account Id is required!" });
        }
        const account = await accounts_1.default.findOne({ _id: accountId });
        if (!account) {
            return res.status(404).json({ message: "Account not found!" });
        }
        if (account.isSystemGenerated) {
            return res.status(http_status_1.HTTP_STATUS.FORBIDDEN).json({ message: "System generated account cannot be deleted!" });
        }
        await accounts_1.default.findByIdAndUpdate(accountId, {
            isDeleted: true,
            deletedAt: new Date(),
            deletedById: user._id,
            // deletedBy: user.name,
        });
        return res.status(200).json({
            message: "Account deleted successfully!",
        });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteAcccount = deleteAcccount;
