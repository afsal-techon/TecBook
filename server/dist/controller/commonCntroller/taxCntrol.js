"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTax = exports.updateTax = exports.getALLTaxes = exports.getTaxes = exports.createTax = void 0;
const branch_access_helper_1 = require("../../Helper/branch-access.helper");
const branch_1 = __importDefault(require("../../models/branch"));
const tax_1 = __importDefault(require("../../models/tax"));
const user_1 = __importDefault(require("../../models/user"));
const user_2 = __importDefault(require("../../models/user"));
const createTax = async (req, res, next) => {
    try {
        const { branchId, name, type, cgstRate, sgstRate, vatRate, description } = req.body;
        const userId = req.user?.id;
        // 1 Validate user
        const user = await user_2.default.findOne({ _id: userId, isDeleted: false });
        if (!user)
            return res.status(400).json({ message: "User not found!" });
        // 2️ Validate input
        if (!name) {
            return res.status(400).json({ message: "Tax name is required!" });
        }
        if (!type) {
            return res.status(400).json({ message: "Tax type is required!" });
        }
        if (!branchId) {
            return res.status(400).json({ message: "Branch Id is required!" });
        }
        // 3️ Validate tax type logic
        if (type === "GST" && (cgstRate == null || sgstRate == null)) {
            return res
                .status(400)
                .json({ message: "CGST and SGST rates are required for GST type!" });
        }
        if (type === "VAT" && vatRate == null) {
            return res
                .status(400)
                .json({ message: "VAT rate is required for VAT type!" });
        }
        // 4️ Prevent duplicate (same name under same branch)
        const existingTax = await tax_1.default.findOne({
            branchId,
            name: { $regex: `^${name}$`, $options: "i" },
            isDeleted: false,
        });
        if (existingTax)
            return res.status(400).json({ message: `Tax '${name}' already exists!` });
        // 5️ Create new tax
        const newTax = new tax_1.default({
            branchId,
            name,
            type,
            cgstRate: type === "GST" ? cgstRate : null,
            sgstRate: type === "GST" ? sgstRate : null,
            vatRate: type === "VAT" ? vatRate : null,
            description,
            createdById: userId,
        });
        await newTax.save();
        return res.status(201).json({
            message: "Tax created successfully!",
            data: newTax,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.createTax = createTax;
const getTaxes = async (req, res, next) => {
    try {
        const { branchId } = req.query;
        const taxes = await tax_1.default.find({
            branchId,
            isActive: true,
            isDeleted: false,
        }).sort({ createdAt: -1 });
        return res.status(200).json({
            data: taxes,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getTaxes = getTaxes;
const getALLTaxes = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        // Validate user
        const user = await user_2.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        // Pagination
        const limit = parseInt(req.query.limit) || 20;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        const filterBranchId = req.query.branchId;
        const { allowedBranchIds } = await (0, branch_access_helper_1.resolveUserAndAllowedBranchIds)({
            userId: userId,
            userModel: user_1.default,
            branchModel: branch_1.default,
            requestedBranchId: filterBranchId,
        });
        // Search filter
        const search = (req.query.search || "").trim();
        const match = {
            isDeleted: false,
            branchId: { $in: allowedBranchIds },
        };
        // Add search conditions
        if (search) {
            match.name = { $regex: search, $options: "i" };
        }
        // Pipeline
        const pipeline = [
            { $match: match },
            {
                $project: {
                    _id: 1,
                    branchId: 1,
                    name: 1,
                    type: 1,
                    cgstRate: 1,
                    sgstRate: 1,
                    vatRate: 1,
                    description: 1,
                    isActive: 1,
                    createdAt: 1,
                    updatedAt: 1,
                },
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
        ];
        const taxes = await tax_1.default.aggregate(pipeline);
        // Total count for pagination
        const totalCount = await tax_1.default.countDocuments(match);
        return res.status(200).json({
            data: taxes,
            totalCount,
            page,
            limit,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getALLTaxes = getALLTaxes;
const updateTax = async (req, res, next) => {
    try {
        const { taxId } = req.params; // tax ID from URL
        const { branchId, name, type, cgstRate, sgstRate, vatRate, description,
        //   isActive,
         } = req.body;
        const userId = req.user?.id;
        // 1️ Validate user
        const user = await user_2.default.findOne({ _id: userId, isDeleted: false });
        if (!user)
            return res.status(400).json({ message: "User not found!" });
        // 2️ Validate tax existence
        const existingTax = await tax_1.default.findOne({ _id: taxId, isDeleted: false });
        if (!existingTax)
            return res.status(404).json({ message: "Tax record not found!" });
        // 3️ Prevent duplicate name in same branch (excluding current)
        if (name) {
            const duplicateTax = await tax_1.default.findOne({
                _id: { $ne: taxId },
                branchId,
                name: { $regex: `^${name}$`, $options: "i" },
                isDeleted: false,
                // isActive: true,
            });
            if (duplicateTax) {
                return res.status(400).json({
                    message: `Another tax with name '${name}' already exists!`,
                });
            }
        }
        // 4️ Validate type-specific fields
        if (type === "GST") {
            if (cgstRate == null || sgstRate == null) {
                return res.status(400).json({
                    message: "CGST and SGST rates are required for GST type!",
                });
            }
        }
        if (type === "VAT") {
            if (vatRate == null) {
                return res
                    .status(400)
                    .json({ message: "VAT rate is required for VAT type!" });
            }
        }
        // 5️ Prepare update data
        const updateData = {
            // branchId,
            name,
            type,
            cgstRate: type === "GST" ? cgstRate : null,
            sgstRate: type === "GST" ? sgstRate : null,
            vatRate: type === "VAT" ? vatRate : null,
            description,
            //   isActive,
            updatedById: userId,
            updatedAt: new Date(),
        };
        // Remove undefined/null fields (to allow partial updates)
        // Object.keys(updateData).forEach(
        //   (key) => updateData[key] === undefined && delete updateData[key]
        // );
        // 6️ Update document
        const updatedTax = await tax_1.default.findByIdAndUpdate(taxId, updateData, {
            new: true,
        });
        // 7️ Response
        return res.status(200).json({
            message: "Tax updated successfully!",
            data: updatedTax,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.updateTax = updateTax;
const deleteTax = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { taxId } = req.params;
        // Validate user
        const user = await user_2.default.findOne({ _id: userId, isDeleted: false });
        if (!user)
            return res.status(400).json({ message: "User not found!" });
        if (!taxId) {
            return res.status(400).json({ message: "Tax Id is required!" });
        }
        const tax = await tax_1.default.findOne({ _id: taxId });
        if (!tax) {
            return res.status(404).json({ message: "Tax not found!" });
        }
        await tax_1.default.findByIdAndUpdate(taxId, {
            isDeleted: true,
            deletedAt: new Date(),
            deletedById: user._id,
            // deletedBy: user.name,
        });
        return res.status(200).json({
            message: "Tax deleted successfully!",
        });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteTax = deleteTax;
