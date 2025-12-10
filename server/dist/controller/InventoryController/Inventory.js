"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteItems = exports.getOneItem = exports.getItemsList = exports.getAllItems = exports.updateItem = exports.createItem = exports.deleteUnit = exports.updateUnit = exports.getAllUnits = exports.createUnit = exports.deleteCategory = exports.updateCategory = exports.getAllCategories = exports.createCategory = void 0;
const category_1 = __importDefault(require("../../models/category"));
const user_1 = __importDefault(require("../../models/user"));
const mongoose_1 = __importDefault(require("mongoose"));
const branch_1 = __importDefault(require("../../models/branch"));
const unit_1 = __importDefault(require("../../models/unit"));
const items_1 = __importDefault(require("../../models/items"));
const mongoose_2 = require("mongoose");
const tax_1 = __importDefault(require("../../models/tax"));
const createCategory = async (req, res, next) => {
    try {
        const { branchIds, categories } = req.body;
        const userId = req.user?.id; //  assuming req.user is populated from auth middleware
        // 1️ Validate user
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        // 2️ Validate branchIds
        if (!branchIds || !Array.isArray(branchIds) || branchIds.length === 0) {
            return res.status(400).json({ message: "Branch IDs are required!" });
        }
        //  Validate departments array
        if (!categories || !Array.isArray(categories) || categories.length === 0) {
            return res.status(400).json({ message: "Categories are required!" });
        }
        for (const category of categories) {
            if (!category) {
                return res.status(400).json({ message: "Category name is required!" });
            }
        }
        // 4️ Check duplicates in DB
        const categoryNames = categories.map((dept) => dept.trim());
        const existCategories = await category_1.default.find({
            branchIds: { $in: branchIds },
            name: { $in: categoryNames },
            isDeleted: false,
        }).collation({ locale: "en", strength: 2 });
        if (existCategories.length > 0) {
            existCategories.map((d) => d.name);
            return res.status(400).json({
                message: `The following categories already exist: ${existCategories.join(", ")}`,
            });
        }
        const categoryData = categoryNames.map((category) => ({
            name: category,
            branchIds,
            createdById: userId,
            isDeleted: false,
        }));
        // 6️ Insert all at once
        await category_1.default.insertMany(categoryData);
        return res.status(201).json({
            message: "Categories created successfully!",
        });
    }
    catch (err) {
        next(err);
    }
};
exports.createCategory = createCategory;
const getAllCategories = async (req, res, next) => {
    try {
        const filterBranchId = req.query.branchId;
        const userId = req.user?.id;
        // validate user
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        const userRole = user.role;
        // pagination
        const limit = parseInt(req.query.limit) || 20;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        // search term
        const search = (req.query.search || "").trim();
        //  Determine allowed branches
        let allowedBranchIds = [];
        if (userRole === "CompanyAdmin") {
            // Fetch all branches owned by this CompanyAdmin
            const branches = await branch_1.default.find({
                companyAdminId: userId,
                isDeleted: false,
            }).select("_id");
            allowedBranchIds = branches.map((b) => new mongoose_1.default.Types.ObjectId(b._id));
        }
        else if (userRole === "User") {
            // Fetch the user's assigned branchId
            if (!user.branchId) {
                return res
                    .status(400)
                    .json({ message: "User is not assigned to any branch!" });
            }
            allowedBranchIds = [user.branchId];
        }
        else {
            return res
                .status(403)
                .json({ message: "Unauthorized role for this operation." });
        }
        // 🔹 If branchId is provided in query, filter within allowed branches
        if (filterBranchId) {
            const filterId = new mongoose_1.default.Types.ObjectId(filterBranchId);
            if (!allowedBranchIds.some((id) => id.equals(filterId))) {
                return res.status(403).json({
                    message: "You are not authorized to view departments for this branch!",
                });
            }
            allowedBranchIds = [filterId];
        }
        //  Base match
        const matchStage = {
            isDeleted: false,
            branchIds: { $in: allowedBranchIds },
        };
        // 🔹 Search filter
        if (search) {
            matchStage.name = { $regex: search, $options: "i" };
        }
        // 🔹 Aggregation pipeline
        const pipeline = [
            { $match: matchStage },
            {
                $lookup: {
                    from: "branches",
                    localField: "branchIds",
                    foreignField: "_id",
                    as: "branches",
                },
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    isDeleted: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    branchIds: 1,
                    branches: {
                        _id: 1,
                        branchName: 1,
                    },
                },
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
        ];
        // 🔹 Count total (before pagination)
        const countPipeline = [{ $match: matchStage }, { $count: "totalCount" }];
        const countResult = await category_1.default.aggregate(countPipeline);
        const totalCount = countResult[0]?.totalCount || 0;
        const categoriesItems = await category_1.default.aggregate(pipeline);
        return res.status(200).json({
            data: categoriesItems,
            totalCount,
            page,
            limit,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getAllCategories = getAllCategories;
const updateCategory = async (req, res, next) => {
    try {
        const { categoryId, branchIds, name } = req.body;
        const userId = req.user?.id;
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        if (!branchIds || !Array.isArray(branchIds) || branchIds.length === 0)
            return res.status(400).json({ message: "Branch Ids are required!" });
        if (!categoryId) {
            return res.status(400).json({ message: "Category Id is required!" });
        }
        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return res
                .status(400)
                .json({ message: "New category name is required!" });
        }
        const branches = await branch_1.default.find({ _id: { $in: branchIds } });
        const category = await category_1.default.findOne({
            _id: categoryId,
            isDeleted: false,
        });
        if (!category) {
            return res.status(404).json({ message: "Category not found!" });
        }
        const existCategory = await category_1.default.findOne({
            branchIds: { $in: branchIds },
            name: name.trim(),
            isDeleted: false,
            _id: { $ne: categoryId }, // Exclude the current department
        });
        if (existCategory) {
            return res.status(400).json({
                message: `The category already exists!`,
            });
        }
        category.name = name.trim();
        category.branchIds = branchIds;
        await category.save();
        return res.status(200).json({
            message: "Category updated successfully!",
            data: category,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.updateCategory = updateCategory;
const deleteCategory = async (req, res, next) => {
    try {
        const { categoryId } = req.params;
        const userId = req.user?.id;
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        if (!categoryId) {
            return res.status(400).json({ message: "Category Id is required!" });
        }
        const category = await category_1.default.findOne({ _id: categoryId });
        if (!category) {
            return res.status(404).json({ message: "Category not found!" });
        }
        const itemExist = await items_1.default.findOne({
            categoryId: categoryId,
            isDeleted: false,
        });
        if (itemExist) {
            return res.status(400).json({
                message: "This category currently linked to Items. Please remove Items before deleting.",
            });
        }
        await category_1.default.findByIdAndUpdate(categoryId, {
            isDeleted: true,
            deletedAt: new Date(),
            deletedById: user._id,
            deletedBy: user.username,
        });
        return res.status(200).json({
            message: "Category deleted successfully!",
        });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteCategory = deleteCategory;
//unit
const createUnit = async (req, res, next) => {
    try {
        const { branchIds, units } = req.body;
        const userId = req.user?.id; //  assuming req.user is populated from auth middleware
        // 1️ Validate user
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        // 2️ Validate branchIds
        if (!branchIds || !Array.isArray(branchIds) || branchIds.length === 0) {
            return res.status(400).json({ message: "Branch IDs are required!" });
        }
        //  Validate departments array
        if (!units || !Array.isArray(units) || units.length === 0) {
            return res.status(400).json({ message: "Units are required!" });
        }
        for (const unit of units) {
            if (!unit) {
                return res.status(400).json({ message: "unit name is required!" });
            }
        }
        // 4️ Check duplicates in DB
        const unitNames = units.map((dept) => dept.trim());
        const existunits = await unit_1.default.find({
            branchIds: { $in: branchIds },
            unit: { $in: unitNames },
            isDeleted: false,
        }).collation({ locale: "en", strength: 2 });
        if (existunits.length > 0) {
            existunits.map((d) => d.unit);
            return res.status(400).json({
                message: `The following units already exist!`,
            });
        }
        const unitData = unitNames.map((uni) => ({
            unit: uni,
            branchIds,
            createdById: userId,
            isDeleted: false,
        }));
        // 6️ Insert all at once
        await unit_1.default.insertMany(unitData);
        return res.status(201).json({
            message: "Units created successfully!",
        });
    }
    catch (err) {
        next(err);
    }
};
exports.createUnit = createUnit;
const getAllUnits = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        // validate user
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        const userRole = user.role; // e.g., "CompanyAdmin" or "User"
        const filterBranchId = req.query.branchId;
        // pagination
        const limit = parseInt(req.query.limit) || 20;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        // search term
        const search = (req.query.search || "").trim();
        //  Determine allowed branches
        let allowedBranchIds = [];
        if (userRole === "CompanyAdmin") {
            // Fetch all branches owned by this CompanyAdmin
            const branches = await branch_1.default.find({
                companyAdminId: userId,
                isDeleted: false,
            }).select("_id");
            allowedBranchIds = branches.map((b) => new mongoose_1.default.Types.ObjectId(b._id));
        }
        else if (userRole === "User") {
            // Fetch the user's assigned branchId
            if (!user.branchId) {
                return res
                    .status(400)
                    .json({ message: "User is not assigned to any branch!" });
            }
            allowedBranchIds = [user.branchId];
        }
        else {
            return res
                .status(403)
                .json({ message: "Unauthorized role for this operation." });
        }
        // 🔹 If branchId is provided in query, filter within allowed branches
        if (filterBranchId) {
            const filterId = new mongoose_1.default.Types.ObjectId(filterBranchId);
            if (!allowedBranchIds.some((id) => id.equals(filterId))) {
                return res.status(403).json({
                    message: "You are not authorized to view departments for this branch!",
                });
            }
            allowedBranchIds = [filterId];
        }
        //  Base match
        const matchStage = {
            isDeleted: false,
            branchIds: { $in: allowedBranchIds },
        };
        if (search) {
            matchStage.unit = { $regex: search, $options: "i" };
        }
        // 🔹 Aggregation pipeline
        const pipeline = [
            { $match: matchStage },
            {
                $lookup: {
                    from: "branches",
                    localField: "branchIds",
                    foreignField: "_id",
                    as: "branches",
                },
            },
            {
                $project: {
                    _id: 1,
                    unit: 1,
                    isDeleted: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    branchIds: 1,
                    branches: {
                        _id: 1,
                        branchName: 1,
                    },
                },
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
        ];
        const countPipeline = [{ $match: matchStage }, { $count: "totalCount" }];
        const countResult = await unit_1.default.aggregate(countPipeline);
        const totalCount = countResult[0]?.totalCount || 0;
        // 🔹 Execute query
        const unitsDatas = await unit_1.default.aggregate(pipeline);
        return res.status(200).json({
            data: unitsDatas,
            totalCount,
            page,
            limit,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getAllUnits = getAllUnits;
const updateUnit = async (req, res, next) => {
    try {
        const { unitId, branchIds, unit } = req.body;
        const userId = req.user?.id;
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        if (!branchIds || !Array.isArray(branchIds) || branchIds.length === 0)
            return res.status(400).json({ message: "Branch Ids are required!" });
        if (!unitId) {
            return res.status(400).json({ message: "Unit Id is required!" });
        }
        if (!unit || typeof unit !== "string" || unit.trim().length === 0) {
            return res.status(400).json({ message: "New  unit is required!" });
        }
        // const branches = await BRANCH.find({ _id: { $in: branchIds } });
        const unitData = await unit_1.default.findOne({
            _id: unitId,
            isDeleted: false,
        });
        if (!unitData) {
            return res.status(404).json({ message: "Unit not found!" });
        }
        const existingUnit = await unit_1.default.findOne({
            branchIds: { $in: branchIds },
            unit: unit.trim(),
            isDeleted: false,
            _id: { $ne: unitId }, // Exclude the current department
        });
        if (existingUnit) {
            return res.status(400).json({
                message: `The unit already exists!`,
            });
        }
        unitData.unit = unit.trim();
        unitData.branchIds = branchIds;
        await unitData.save();
        return res.status(200).json({
            message: "Unit updated successfully!",
            data: unitData,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.updateUnit = updateUnit;
const deleteUnit = async (req, res, next) => {
    try {
        const { unitId } = req.params;
        const userId = req.user?.id;
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        if (!unitId) {
            return res.status(400).json({ message: "Unit Id is required!" });
        }
        const unit = await unit_1.default.findOne({ _id: unitId });
        if (!unit) {
            return res.status(404).json({ message: "Unit not found!" });
        }
        const unitUsed = await items_1.default.findOne({
            isDeleted: false,
            $or: [
                { "salesInfo.saleUnitId": unitId },
                { "purchaseInfo.purchaseUnitId": unitId },
            ],
        });
        if (unitUsed) {
            return res.status(400).json({
                message: "This unit currently linked to items. Please remove items before deleting.",
            });
        }
        await unit_1.default.findByIdAndUpdate(unitId, {
            isDeleted: true,
            deletedAt: new Date(),
            deletedById: user._id,
            deletedBy: user.username,
        });
        return res.status(200).json({
            message: "Unit deleted successfully!",
        });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteUnit = deleteUnit;
//items
const createItem = async (req, res, next) => {
    try {
        const { branchId, type, categoryId, name, salesInfo, purchaseInfo, conversionRate, taxTreatment, inventoryTracking, sellable, purchasable,
        // taxId,
         } = req.body;
        const userId = req.user?.id;
        // 1️ Validate user
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user)
            return res.status(400).json({ message: "User not found!" });
        // 2️ Validate required fields
        if (!branchId)
            return res.status(400).json({ message: "Branch ID is required!" });
        if (!type)
            return res.status(400).json({ message: "Type is required!" });
        if (!name)
            return res.status(400).json({ message: "Item name is required!" });
        // 3️ Prevent duplicate item name (case-insensitive per branch)
        const trimmedName = name.trim();
        const existingItem = await items_1.default.findOne({
            branchId,
            name: { $regex: `^${trimmedName}$`, $options: "i" },
            isDeleted: false,
        });
        if (existingItem)
            return res
                .status(400)
                .json({ message: `Item "${name}" already exists in this branch.` });
        if (type === "Service") {
            if (inventoryTracking?.isTrackable) {
                inventoryTracking.isTrackable = false;
            }
        }
        let purchaseTaxData = null;
        let salesTaxData = null;
        // Purchase Tax
        if (purchaseInfo?.taxId) {
            purchaseTaxData = await tax_1.default.findOne({
                _id: purchaseInfo.taxId,
                isDeleted: false,
            });
            if (!purchaseTaxData) {
                return res
                    .status(400)
                    .json({ message: "Invalid purchase tax selected!" });
            }
        }
        // Sales Tax
        if (salesInfo?.taxId) {
            salesTaxData = await tax_1.default.findOne({
                _id: salesInfo.taxId,
                isDeleted: false,
            });
            if (!salesTaxData) {
                return res.status(400).json({ message: "Invalid sales tax selected!" });
            }
        }
        // Calculate totalOpeningValue if inventory tracking is enabled
        // let totalOpeningValue = 0;
        // if (inventoryTracking?.isTrackable) {
        //   const openingStock = Number(inventoryTracking.openingStock) || 0;
        //   const rate = Number(inventoryTracking.openingStockRatePerUnit) || 0;
        //   totalOpeningValue = openingStock * rate;
        // }
        // 🔹 Create Item document
        const newItem = new items_1.default({
            branchId,
            categoryId,
            name: name.trim(),
            type,
            salesInfo: {
                sellingPrice: salesInfo?.sellingPrice || null,
                accountId: salesInfo?.accountId || null,
                description: salesInfo?.description || null,
                saleUnitId: salesInfo?.saleUnitId || null,
                taxId: salesTaxData?._id || null,
            },
            purchaseInfo: {
                costPrice: purchaseInfo?.costPrice || null,
                accountId: purchaseInfo?.accountId || null,
                description: purchaseInfo?.description || null,
                purchaseUnitId: purchaseInfo?.purchaseUnitId || null,
                taxId: purchaseTaxData?._id || null,
            },
            conversionRate: conversionRate || 1,
            taxTreatment: taxTreatment || null,
            sellable: sellable ?? false,
            purchasable: purchasable ?? false,
            inventoryTracking: inventoryTracking
                ? {
                    isTrackable: inventoryTracking.isTrackable || false,
                    inventoryAccountId: inventoryTracking.inventoryAccountId || null,
                    openingStock: inventoryTracking.openingStock || 0,
                    openingStockRatePerUnit: inventoryTracking.openingStockRatePerUnit || 0,
                    reorderPoint: inventoryTracking.reorderPoint || 0,
                }
                : null,
            createdById: user._id,
        });
        await newItem.save();
        // 6️ Send success response
        return res.status(201).json({
            message: "Item created successfully!",
        });
    }
    catch (err) {
        next(err);
    }
};
exports.createItem = createItem;
const updateItem = async (req, res, next) => {
    try {
        console.log(req.body, "body");
        const { branchId, itemId, type, categoryId, name, salesInfo, purchaseInfo, conversionRate, taxTreatment, inventoryTracking, sellable, purchasable, } = req.body;
        const userId = req.user?.id;
        // 1 Validate user
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user)
            return res.status(400).json({ message: "User not found!" });
        // 2 Validate item
        const item = await items_1.default.findOne({ _id: itemId, isDeleted: false });
        if (!item)
            return res.status(404).json({ message: "Item not found!" });
        // 3 Prevent duplicate item names (case-insensitive)
        if (name && name.trim().toLowerCase() !== item.name.toLowerCase()) {
            const duplicate = await items_1.default.findOne({
                branchId: branchId || item.branchId,
                name: { $regex: `^${name.trim()}$`, $options: "i" },
                _id: { $ne: itemId },
                isDeleted: false,
            });
            if (duplicate) {
                return res
                    .status(400)
                    .json({ message: `Item "${name}" already exists in this branch.` });
            }
        }
        // Initialize safely
        let updatedInventoryTracking = item.inventoryTracking || {
            isTrackable: false,
            inventoryAccountId: null,
            openingStock: 0,
            openingStockRatePerUnit: 0,
            reOrderPoint: 0,
        };
        // 5 Handle type-based inventory logic
        const updatedType = type || item.type;
        if (updatedType === "Service") {
            updatedInventoryTracking.isTrackable = false;
        }
        else if (inventoryTracking) {
            updatedInventoryTracking = {
                ...updatedInventoryTracking,
                isTrackable: inventoryTracking.isTrackable ??
                    updatedInventoryTracking.isTrackable ??
                    false,
                inventoryAccountId: inventoryTracking.inventoryAccountId
                    ? new mongoose_2.Types.ObjectId(inventoryTracking.inventoryAccountId)
                    : null,
                openingStock: inventoryTracking.openingStock ??
                    updatedInventoryTracking.openingStock ??
                    0,
                openingStockRatePerUnit: inventoryTracking.openingStockRatePerUnit ??
                    updatedInventoryTracking.openingStockRatePerUnit ??
                    0,
                reOrderPoint: inventoryTracking.reOrderPoint ??
                    updatedInventoryTracking.reOrderPoint ??
                    0,
            };
        }
        // If not trackable → wipe all inventory fields
        if (!updatedInventoryTracking.isTrackable) {
            updatedInventoryTracking = {
                isTrackable: false,
                inventoryAccountId: null,
                openingStock: 0,
                openingStockRatePerUnit: 0,
                reOrderPoint: 0,
            };
        }
        // 6️Validate tax (if provided)
        let purchaseTaxData = null;
        let salesTaxData = null;
        // Purchase Tax
        if (purchaseInfo?.taxId) {
            purchaseTaxData = await tax_1.default.findOne({
                _id: purchaseInfo.taxId,
                isDeleted: false,
            });
            if (!purchaseTaxData) {
                return res
                    .status(400)
                    .json({ message: "Invalid purchase tax selected!" });
            }
        }
        // Sales Tax
        if (salesInfo?.taxId) {
            salesTaxData = await tax_1.default.findOne({
                _id: salesInfo.taxId,
                isDeleted: false,
            });
            if (!salesTaxData) {
                return res
                    .status(400)
                    .json({ message: "Invalid sales tax selected!" });
            }
        }
        // 7 Update base item fields
        item.branchId = branchId || item.branchId;
        item.categoryId = categoryId || item.categoryId;
        item.name = name ? name.trim() : item.name;
        item.type = updatedType;
        item.taxTreatment = taxTreatment ?? item.taxTreatment;
        item.sellable = sellable ?? item.sellable;
        item.purchasable = purchasable ?? item.purchasable;
        item.conversionRate = conversionRate ?? item.conversionRate;
        // 8 Update sales info (if provided)
        if (salesInfo) {
            item.salesInfo = {
                ...item.salesInfo,
                sellingPrice: salesInfo.sellingPrice ?? item.salesInfo?.sellingPrice,
                accountId: salesInfo.accountId ?? item.salesInfo?.accountId,
                description: salesInfo.description ?? item.salesInfo?.description,
                saleUnitId: salesInfo.saleUnitId ?? item.salesInfo?.saleUnitId,
                taxId: salesInfo.taxId ?? item.salesInfo?.taxId,
            };
        }
        // 9 Update purchase info (if provided)
        if (purchaseInfo) {
            item.purchaseInfo = {
                ...item.purchaseInfo,
                costPrice: purchaseInfo.costPrice ?? item.purchaseInfo?.costPrice,
                accountId: purchaseInfo.accountId ?? item.purchaseInfo?.accountId,
                description: purchaseInfo.description ?? item.purchaseInfo?.description,
                purchaseUnitId: purchaseInfo.purchaseUnitId ?? item.purchaseInfo?.purchaseUnitId,
                taxId: purchaseInfo.taxId ?? item.purchaseInfo?.taxId,
            };
        }
        // Apply inventory tracking (FIXED TYPE)
        item.inventoryTracking =
            updatedInventoryTracking;
        item.updatedAt = new Date();
        await item.save();
        return res.status(200).json({
            message: "Item updated successfully!",
        });
    }
    catch (err) {
        next(err);
    }
};
exports.updateItem = updateItem;
const getAllItems = async (req, res, next) => {
    try {
        const branchId = req.query.branchId;
        const userId = req.user?.id;
        //  Validate user
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user)
            return res.status(400).json({ message: "User not found!" });
        //  Validate branchId
        if (!branchId) {
            return res.status(400).json({ message: "Branch Id is required!" });
        }
        //  Pagination
        const limit = parseInt(req.query.limit) || 20;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        //  Search and filters
        const search = (req.query.search || "").trim();
        const itemType = req.query.itemType?.trim()?.toLowerCase();
        const salesAccountName = (req.query.salesAccount || "").trim();
        const purchaseAccountName = (req.query.purchaseAccount || "").trim();
        const inventoryOnly = req.query.inventoryOnly === "true" || req.query.inventoryOnly === "1";
        //  Base match
        const matchStage = {
            branchId: new mongoose_1.default.Types.ObjectId(branchId),
            isDeleted: false,
        };
        if (itemType === "sellable")
            matchStage.sellable = true;
        else if (itemType === "purchasable")
            matchStage.purchasable = true;
        //  Build aggregation pipeline
        const pipeline = [
            { $match: matchStage },
            // 🔹 Category lookup
            {
                $lookup: {
                    from: "categories",
                    localField: "categoryId",
                    foreignField: "_id",
                    as: "category",
                },
            },
            { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
            // 🔹 Sales account lookup
            {
                $lookup: {
                    from: "accounts",
                    localField: "salesInfo.accountId",
                    foreignField: "_id",
                    as: "salesAccount",
                },
            },
            { $unwind: { path: "$salesAccount", preserveNullAndEmptyArrays: true } },
            // 🔹 Purchase account lookup
            {
                $lookup: {
                    from: "accounts",
                    localField: "purchaseInfo.accountId",
                    foreignField: "_id",
                    as: "purchaseAccount",
                },
            },
            {
                $unwind: { path: "$purchaseAccount", preserveNullAndEmptyArrays: true },
            },
        ];
        //  Single “smart” search — match item name, category name, or selling price
        if (search) {
            const isNumber = !isNaN(Number(search));
            const searchConditions = [
                { name: { $regex: search, $options: "i" } }, // match item name
                { "category.name": { $regex: search, $options: "i" } }, // match category
            ];
            if (isNumber) {
                searchConditions.push({ "salesInfo.sellingPrice": Number(search) });
            }
            pipeline.push({ $match: { $or: searchConditions } });
        }
        //  Filter by Sales Account Name
        if (salesAccountName) {
            pipeline.push({
                $match: {
                    "salesAccount.accountName": {
                        $regex: salesAccountName,
                        $options: "i",
                    },
                },
            });
        }
        //  Filter by Purchase Account Name
        if (purchaseAccountName) {
            pipeline.push({
                $match: {
                    "purchaseAccount.accountName": {
                        $regex: purchaseAccountName,
                        $options: "i",
                    },
                },
            });
        }
        if (inventoryOnly) {
            pipeline.push({
                $match: { "inventoryTracking.isTrackable": true },
            });
        }
        pipeline.push({
            $addFields: {
                totalOpeningValue: {
                    $cond: [
                        "$inventoryTracking.isTrackable",
                        {
                            $multiply: [
                                { $ifNull: ["$inventoryTracking.openingStock", 0] },
                                { $ifNull: ["$inventoryTracking.openingStockRatePerUnit", 0] },
                            ],
                        },
                        0,
                    ],
                },
                totalStockInBaseUnit: {
                    $cond: [
                        "$inventoryTracking.isTrackable",
                        {
                            $multiply: [
                                { $ifNull: ["$inventoryTracking.openingStock", 0] },
                                { $ifNull: ["$conversionRate", 1] },
                            ],
                        },
                        0,
                    ],
                },
            },
        });
        //  Project only required fields
        pipeline.push({
            $project: {
                _id: 1,
                branchId: 1,
                name: 1,
                type: 1,
                category: "$category.name",
                categoryId: "$category._id",
                unitId: 1,
                sellable: 1,
                purchasable: 1,
                salesInfo: 1,
                conversionRate: 1,
                purchaseInfo: 1,
                taxTreatment: 1,
                inventoryTracking: 1,
                totalOpeningValue: 1,
                totalStockInBaseUnit: 1,
                salesAccountName: "$salesAccount.accountName",
                purchaseAccountName: "$purchaseAccount.accountName",
                createdAt: 1,
                updatedAt: 1,
            },
        });
        //  Count total before pagination
        const countPipeline = [...pipeline, { $count: "totalCount" }];
        const countResult = await items_1.default.aggregate(countPipeline);
        const totalCount = countResult[0]?.totalCount || 0;
        //  Apply sorting & pagination
        pipeline.push({ $sort: { createdAt: -1 } });
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: limit });
        //  Execute query
        const items = await items_1.default.aggregate(pipeline);
        //  Response
        return res.status(200).json({
            data: items,
            totalCount,
            page,
            limit,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getAllItems = getAllItems;
const getItemsList = async (req, res, next) => {
    try {
        const { branchId } = req.params;
        const userId = req.user?.id;
        //  Validate user
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        //  Validate branchId
        if (!branchId) {
            return res.status(400).json({ message: "Branch Id is required!" });
        }
        const branchObjectId = new mongoose_2.Types.ObjectId(branchId);
        const pipeline = [
            {
                $match: {
                    branchId: branchObjectId,
                    isDeleted: false,
                    sellable: true
                },
            },
            // Category
            {
                $lookup: {
                    from: "categories",
                    localField: "categoryId",
                    foreignField: "_id",
                    as: "category",
                },
            },
            {
                $unwind: {
                    path: "$category",
                    preserveNullAndEmptyArrays: true,
                },
            },
            // Sales account
            {
                $lookup: {
                    from: "accounts",
                    localField: "salesInfo.accountId",
                    foreignField: "_id",
                    as: "salesAccount",
                },
            },
            {
                $unwind: {
                    path: "$salesAccount",
                    preserveNullAndEmptyArrays: true,
                },
            },
            // Purchase account
            {
                $lookup: {
                    from: "accounts",
                    localField: "purchaseInfo.accountId",
                    foreignField: "_id",
                    as: "purchaseAccount",
                },
            },
            {
                $unwind: {
                    path: "$purchaseAccount",
                    preserveNullAndEmptyArrays: true,
                },
            },
            // Inventory account
            {
                $lookup: {
                    from: "accounts",
                    localField: "inventoryTracking.inventoryAccountId",
                    foreignField: "_id",
                    as: "inventoryAccount",
                },
            },
            {
                $unwind: {
                    path: "$inventoryAccount",
                    preserveNullAndEmptyArrays: true,
                },
            },
            // Sales tax
            {
                $lookup: {
                    from: "taxes",
                    localField: "salesInfo.taxId",
                    foreignField: "_id",
                    as: "salesTax",
                },
            },
            {
                $unwind: {
                    path: "$salesTax",
                    preserveNullAndEmptyArrays: true,
                },
            },
            // Purchase tax
            {
                $lookup: {
                    from: "taxes",
                    localField: "purchaseInfo.taxId",
                    foreignField: "_id",
                    as: "purchaseTax",
                },
            },
            {
                $unwind: {
                    path: "$purchaseTax",
                    preserveNullAndEmptyArrays: true,
                },
            },
            // Sales unit
            {
                $lookup: {
                    from: "units",
                    localField: "salesInfo.saleUnitId",
                    foreignField: "_id",
                    as: "saleUnit",
                },
            },
            {
                $unwind: {
                    path: "$saleUnit",
                    preserveNullAndEmptyArrays: true,
                },
            },
            // Purchase unit
            {
                $lookup: {
                    from: "units",
                    localField: "purchaseInfo.purchaseUnitId",
                    foreignField: "_id",
                    as: "purchaseUnit",
                },
            },
            {
                $unwind: {
                    path: "$purchaseUnit",
                    preserveNullAndEmptyArrays: true,
                },
            },
            // Final projection
            {
                $project: {
                    _id: 1,
                    branchId: 1,
                    categoryId: 1,
                    name: 1,
                    type: 1,
                    taxTreatment: 1,
                    // sellable: 1,
                    // inventoryTracking: 1,
                    // Category
                    categoryName: "$category.name", // adjust field name if different
                    // Sales info + joined fields
                    // "salesInfo.sellingPrice": 1,
                    // "salesInfo.accountId": 1,
                    // "salesInfo.saleUnitId": 1,
                    // "salesInfo.taxId": 1,
                    salesAccountName: "$salesAccount.name", // adjust field name
                    saleUnit: "$saleUnit.unit", // adjust field name
                    salesTaxName: "$salesTax.name", // adjust field name
                    salesVATRate: "$salesTax.vatRate",
                    sellingPrice: "$salesInfo.sellingPrice",
                    salesSGST: "$salesTax.cgstRate", // or gst fields, depending on your model
                    salesCGST: "$salesTax.sgstRate",
                    taxId: "$salesInfo.taxId"
                    // Purchase info + joined fields
                    // "purchaseInfo.costPrice": 1,
                    // "purchaseInfo.description": 1,
                    // "purchaseInfo.accountId": 1,
                    // "purchaseInfo.purchaseUnitId": 1,
                    // "purchaseInfo.taxId": 1,
                    // purchaseAccountName: "$purchaseAccount.name",
                    // purchaseUnitName: "$purchaseUnit.name",
                    // purchaseTaxName: "$purchaseTax.name",
                    // purchaseTaxRate: "$purchaseTax.vatRate",
                    // Inventory account
                    // inventoryAccountName: "$inventoryAccount.name",
                },
            },
            { $sort: { createdAt: -1 } },
        ];
        const items = await items_1.default.aggregate(pipeline);
        return res.status(200).json({
            data: items,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getItemsList = getItemsList;
const getOneItem = async (req, res, next) => {
    try {
        const { itemId } = req.params;
        const userId = req.user?.id;
        //  Validate user
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user)
            return res.status(400).json({ message: "User not found!" });
        //  Validate branchId
        if (!itemId) {
            return res.status(400).json({ message: "Item Id is required!" });
        }
        const item = await items_1.default.findOne({ _id: itemId });
        return res.status(200).json({ data: item });
    }
    catch (err) {
        next(err);
    }
};
exports.getOneItem = getOneItem;
const deleteItems = async (req, res, next) => {
    try {
        const { itemId } = req.params;
        const userId = req.user?.id;
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        if (!itemId) {
            return res.status(400).json({ message: "Item Id is required!" });
        }
        const item = await items_1.default.findOne({ _id: itemId });
        if (!item) {
            return res.status(404).json({ message: "Item not found!" });
        }
        await items_1.default.findByIdAndUpdate(itemId, {
            isDeleted: true,
            deletedAt: new Date(),
            deletedById: user._id,
            deletedBy: user.username,
        });
        return res.status(200).json({
            message: "Item deleted successfully!",
        });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteItems = deleteItems;
