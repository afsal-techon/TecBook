"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVendor = exports.updateVendor = exports.getVendors = exports.CreateVendor = void 0;
const vendor_1 = __importDefault(require("../../models/vendor"));
const user_1 = __importDefault(require("../../models/user"));
const mongoose_1 = require("mongoose");
const CreateVendor = async (req, res, next) => {
    try {
        const { branchId, name, phone, note, openingBalance, billingInfo, shippingInfo, taxTreatment, trn, placeOfSupplay, } = req.body;
        const userId = req.user?.id;
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        if (!branchId) {
            return res.status(400).json({ message: "Branch ID is required!" });
        }
        if (!name) {
            return res.status(400).json({ message: "Name is required!" });
        }
        if (!phone) {
            return res.status(400).json({ message: "Phone number is required!" });
        }
        if (!billingInfo) {
            return res.status(400).json({ message: "Billing address is required!" });
        }
        if (!shippingInfo) {
            return res.status(400).json({ message: "Shipping address is required!" });
        }
        if (!taxTreatment) {
            return res.status(400).json({ message: "Tax treatment is required!" });
        }
        // if (!trn) {
        //   return res.status(400).json({ message: "trn is required!" });
        // }
        // if (!placeOfSupplay) {
        //   return res.status(400).json({ message: "Place of supplay required!" });
        // }
        const existContact = await vendor_1.default.findOne({ phone, branchId, isDeleted: false });
        if (existContact)
            return res
                .status(400)
                .json({ message: "Phone number is already exists!" });
        await vendor_1.default.create({
            branchId,
            name,
            phone,
            openingBalance,
            billingInfo,
            shippingInfo,
            taxTreatment,
            trn,
            note,
            placeOfSupplay,
            createdById: user._id
        });
        return res.status(200).json({ message: "Vendor created successfully" });
    }
    catch (err) {
        next(err);
    }
};
exports.CreateVendor = CreateVendor;
const getVendors = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        // Validate user
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        // Branch Id required
        const branchId = req.query.branchId;
        if (!branchId) {
            return res.status(400).json({ message: "Branch ID is required!" });
        }
        // Pagination
        const limit = parseInt(req.query.limit) || 20;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        // Search filter
        const search = (req.query.search || "").trim();
        const match = {
            isDeleted: false,
            branchId: new mongoose_1.Types.ObjectId(branchId),
        };
        // Add search conditions
        if (search.length > 0) {
            match.$or = [
                { name: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } },
            ];
        }
        // Pipeline
        const pipeline = [
            { $match: match },
            {
                $project: {
                    _id: 1,
                    branchId: 1,
                    name: 1,
                    phone: 1,
                    openingBalance: 1,
                    billingInfo: 1,
                    shippingInfo: 1,
                    taxTreatment: 1,
                    trn: 1,
                    placeOfSupplay: 1,
                    createdAt: 1,
                    updatedAt: 1,
                },
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
        ];
        const vendors = await vendor_1.default.aggregate(pipeline);
        // Total count for pagination
        const totalCount = await vendor_1.default.countDocuments(match);
        return res.status(200).json({
            data: vendors,
            totalCount,
            page,
            limit,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getVendors = getVendors;
const updateVendor = async (req, res, next) => {
    try {
        const { vendorId, branchId, name, phone, openingBalance, billingInfo, shippingInfo, taxTreatment, trn, note, placeOfSupplay, } = req.body; // allow partial
        const userId = req.user?.id;
        // Validate user
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        if (!vendorId) {
            return res.status(400).json({ message: "Vendor ID is required!" });
        }
        // Check if customer exists
        const vendor = await vendor_1.default.findOne({ _id: vendorId, isDeleted: false });
        if (!vendor) {
            return res.status(404).json({ message: "Vendor not found!" });
        }
        // Duplicate phone check if updating phone
        if (phone && phone !== vendor.phone) {
            const existContact = await vendor_1.default.findOne({
                phone,
                branchId: branchId || vendor.branchId,
                _id: { $ne: vendorId },
            });
            if (existContact) {
                return res.status(400).json({
                    message: "Phone number already exists for another Vendor!",
                });
            }
        }
        // Build update object — take new values if given, else keep old
        const updateData = {
            branchId: branchId ?? vendor.branchId,
            name: name ?? vendor.name,
            phone: phone ?? vendor.phone,
            openingBalance: openingBalance ?? vendor.openingBalance,
            billingInfo: billingInfo ?? vendor.billingInfo,
            shippingInfo: shippingInfo ?? vendor.shippingInfo,
            taxTreatment: taxTreatment ?? vendor.taxTreatment,
            trn: trn ?? vendor.trn,
            note: note ?? vendor.note,
            placeOfSupplay: placeOfSupplay ?? vendor.placeOfSupplay,
        };
        await vendor_1.default.findByIdAndUpdate(vendorId, updateData, { new: true });
        return res.status(200).json({
            message: "Vendor updated successfully!",
        });
    }
    catch (err) {
        next(err);
    }
};
exports.updateVendor = updateVendor;
const deleteVendor = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { vendorId } = req.params;
        // Validate user
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user)
            return res.status(400).json({ message: "User not found!" });
        if (!vendorId) {
            return res.status(400).json({ message: "Vendor Id is required!" });
        }
        const vendor = await vendor_1.default.findOne({ _id: vendorId });
        if (!vendor) {
            return res.status(404).json({ message: "Vendor not found!" });
        }
        await vendor_1.default.findByIdAndUpdate(vendorId, {
            isDeleted: true,
            deletedAt: new Date(),
            deletedById: user._id,
            // deletedBy: user.name,
        });
        return res.status(200).json({
            message: "Vendor deleted successfully!",
        });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteVendor = deleteVendor;
