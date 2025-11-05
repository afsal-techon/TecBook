"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteItems = exports.getOneItem = exports.getAllItems = exports.updateItem = exports.createItem = exports.deleteUnit = exports.updateUnit = exports.getAllUnits = exports.createUnit = exports.deleteCategory = exports.updateCategory = exports.getAllCategories = exports.createCategory = void 0;
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
        const categoryNames = categories.map((dept) => dept);
        const existCategories = await category_1.default.find({
            branchId: { $in: branchIds },
            name: { $in: categoryNames },
            isDeleted: false,
        }).collation({ locale: "en", strength: 2 });
        if (existCategories.length > 0) {
            existCategories.map((d) => d);
            return res.status(400).json({
                message: `The following categories already exist in one or more branches`,
            });
        }
        // 5️ Prepare bulk insert data
        const categoryData = [];
        for (const branchId of branchIds) {
            for (const category of categories) {
                categoryData.push({
                    branchId,
                    name: category.trim(),
                    //   createdById: userId,
                    isDeleted: false,
                });
            }
        }
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
        const branchId = req.query.branchId;
        const userId = req.user?.id;
        // validate user
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        // validate branchId
        if (!branchId) {
            return res.status(400).json({ message: "Branch Id is required!" });
        }
        // pagination
        const limit = parseInt(req.query.limit) || 20;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        // search term
        const search = (req.query.search || "").trim();
        // build query
        const query = {
            branchId: new mongoose_1.default.Types.ObjectId(branchId),
            isDeleted: false,
        };
        //  only add dept_name when search has content
        if (search.length > 0) {
            query.name = { $regex: search, $options: "i" };
        }
        const totalCount = await category_1.default.countDocuments(query);
        const categories = await category_1.default.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        return res.status(200).json({ data: categories, totalCount, page, limit });
    }
    catch (err) {
        next(err);
    }
};
exports.getAllCategories = getAllCategories;
const updateCategory = async (req, res, next) => {
    try {
        const { categoryId, branchId, name } = req.body;
        const userId = req.user?.id;
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        if (!branchId) {
            return res.status(400).json({ message: "Branch ID is required!" });
        }
        if (!categoryId) {
            return res.status(400).json({ message: "Category Id is required!" });
        }
        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return res
                .status(400)
                .json({ message: "New category name is required!" });
        }
        const branch = await branch_1.default.findById(branchId);
        if (!branch)
            return res.status(400).json({ message: "Branch not found!" });
        const category = await category_1.default.findOne({
            _id: categoryId,
            branchId,
        });
        if (!category) {
            return res.status(404).json({ message: "Category not found!" });
        }
        const existCategory = await category_1.default.findOne({
            branchId,
            name: name.trim(),
            isDeleted: false,
            _id: { $ne: categoryId }, // Exclude the current department
        });
        if (existCategory) {
            return res.status(400).json({
                message: `The category already exists in the specified branch!`,
            });
        }
        if (category.name === name.trim()) {
            return res.status(400).json({
                message: "New category name is the same as the current name!",
            });
        }
        category.name = name.trim();
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
        const unitNames = units.map((dept) => dept);
        const existunits = await unit_1.default.find({
            branchId: { $in: branchIds },
            unit: { $in: unitNames },
            isDeleted: false,
        }).collation({ locale: "en", strength: 2 });
        if (existunits.length > 0) {
            existunits.map((d) => d);
            return res.status(400).json({
                message: `The following units already exist in one or more branches`,
            });
        }
        // 5️ Prepare bulk insert data
        const unitData = [];
        for (const branchId of branchIds) {
            for (const unit of units) {
                unitData.push({
                    branchId,
                    unit: unit.trim(),
                    //   createdById: userId,
                    isDeleted: false,
                });
            }
        }
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
        const branchId = req.query.branchId;
        const userId = req.user?.id;
        // validate user
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        // validate branchId
        if (!branchId) {
            return res.status(400).json({ message: "Branch Id is required!" });
        }
        // pagination
        const limit = parseInt(req.query.limit) || 20;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        // search term
        const search = (req.query.search || "").trim();
        // build query
        const query = {
            branchId: new mongoose_1.default.Types.ObjectId(branchId),
            isDeleted: false,
        };
        //  only add dept_name when search has content
        if (search.length > 0) {
            query.unit = { $regex: search, $options: "i" };
        }
        const totalCount = await unit_1.default.countDocuments(query);
        const units = await unit_1.default.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        return res.status(200).json({ data: units, totalCount, page, limit });
    }
    catch (err) {
        next(err);
    }
};
exports.getAllUnits = getAllUnits;
const updateUnit = async (req, res, next) => {
    try {
        const { unitId, branchId, unit } = req.body;
        const userId = req.user?.id;
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        if (!branchId) {
            return res.status(400).json({ message: "Branch ID is required!" });
        }
        if (!unitId) {
            return res.status(400).json({ message: "Unit Id is required!" });
        }
        if (!unit || typeof unit !== "string" || unit.trim().length === 0) {
            return res.status(400).json({ message: "New  unit is required!" });
        }
        const branch = await branch_1.default.findById(branchId);
        if (!branch)
            return res.status(400).json({ message: "Branch not found!" });
        const unitData = await unit_1.default.findOne({
            _id: unitId,
            branchId,
        });
        if (!unitData) {
            return res.status(404).json({ message: "Unit not found!" });
        }
        const existingUnit = await unit_1.default.findOne({
            branchId,
            unit: unit.trim(),
            isDeleted: false,
            _id: { $ne: unitId }, // Exclude the current department
        });
        if (existingUnit) {
            return res.status(400).json({
                message: `The unit already exists in the specified branch!`,
            });
        }
        if (unitData.unit === unit.trim()) {
            return res.status(400).json({
                message: "New unit is the same as the current unit!",
            });
        }
        unitData.unit = unit.trim();
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
        const { branchId, type, categoryId, name, unitId, salesInfo, purchaseInfo, sellable, purchasable, taxId, } = req.body;
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
        if (!unitId)
            return res.status(400).json({ message: "Unit ID is required!" });
        // 3️ Prevent duplicate item name (case-insensitive per branch)
        const existingItem = await items_1.default.findOne({
            branchId,
            name: { $regex: `^${name}$`, $options: "i" },
            isDeleted: false,
        });
        if (existingItem)
            return res
                .status(400)
                .json({ message: `Item "${name}" already exists in this branch.` });
        let validTax = null;
        if (taxId) {
            validTax = await tax_1.default.findOne({ _id: taxId, isActive: true });
            if (!validTax)
                return res.status(400).json({ message: "Invalid tax selected!" });
        }
        // 4️ Build item object
        const newItem = {
            branchId: new mongoose_2.Types.ObjectId(branchId),
            categoryId: categoryId ? new mongoose_2.Types.ObjectId(categoryId) : null,
            unitId: new mongoose_2.Types.ObjectId(unitId),
            type: type.trim(),
            name: name.trim(),
            salesInfo: {
                sellingPrice: salesInfo?.sellingPrice ?? null,
                accountId: salesInfo?.accountId
                    ? new mongoose_2.Types.ObjectId(salesInfo.accountId)
                    : null,
                description: salesInfo?.description ?? null,
            },
            purchaseInfo: {
                costPrice: purchaseInfo?.costPrice ?? null,
                accountId: purchaseInfo?.accountId
                    ? new mongoose_2.Types.ObjectId(purchaseInfo.accountId)
                    : null,
                description: purchaseInfo?.description ?? null,
            },
            taxId: validTax?._id || null,
            sellable: !!sellable,
            purchasable: !!purchasable,
            createdById: new mongoose_2.Types.ObjectId(userId),
        };
        // 5️ Save to DB
        await items_1.default.create(newItem);
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
        const { itemId, branchId, type, categoryId, name, unitId, salesInfo, purchaseInfo, sellable, purchasable, } = req.body;
        const userId = req.user?.id;
        // 1️. Validate user
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user)
            return res.status(400).json({ message: "User not found!" });
        // 2️. Validate item
        const item = await items_1.default.findOne({ _id: itemId, isDeleted: false });
        if (!item)
            return res.status(404).json({ message: "Item not found!" });
        // 4️. Prevent duplicate name (if updating name)
        if (name && name.trim().toLowerCase() !== item.name.toLowerCase()) {
            const existingItem = await items_1.default.findOne({
                branchId: item.branchId,
                name: { $regex: `^${name}$`, $options: "i" },
                _id: { $ne: itemId },
                isDeleted: false,
            });
            if (existingItem)
                return res
                    .status(400)
                    .json({ message: `Item ${name} already exists in this branch!` });
        }
        // 5️. Build update object (keep old values if not passed)
        const updatedData = {
            type: type ?? item.type,
            categoryId: categoryId ? new mongoose_2.Types.ObjectId(categoryId) : item.categoryId,
            unitId: unitId ? new mongoose_2.Types.ObjectId(unitId) : item.unitId,
            name: name ? name.trim() : item.name,
            salesInfo: {
                sellingPrice: salesInfo?.sellingPrice ?? item.salesInfo?.sellingPrice ?? null,
                accountId: salesInfo?.accountId
                    ? new mongoose_2.Types.ObjectId(salesInfo.accountId)
                    : item.salesInfo?.accountId ?? null,
                description: salesInfo?.description ?? item.salesInfo?.description ?? null,
            },
            purchaseInfo: {
                costPrice: purchaseInfo?.costPrice ?? item.purchaseInfo?.costPrice ?? null,
                accountId: purchaseInfo?.accountId
                    ? new mongoose_2.Types.ObjectId(purchaseInfo.accountId)
                    : item.purchaseInfo?.accountId ?? null,
                description: purchaseInfo?.description ?? item.purchaseInfo?.description ?? null,
            },
            sellable: sellable ?? item.sellable,
            purchasable: purchasable ?? item.purchasable,
        };
        // 6️. Update item
        await items_1.default.findByIdAndUpdate(itemId, updatedData, { new: true });
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
                purchaseInfo: 1,
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
