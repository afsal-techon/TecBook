"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCustomer = exports.updateCustomer = exports.getCustomers = exports.createCustomer = void 0;
const customer_1 = __importDefault(require("../../models/customer"));
const user_1 = __importDefault(require("../../models/user"));
const mongoose_1 = require("mongoose");
const createCustomer = async (req, res, next) => {
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
        const existContact = await customer_1.default.findOne({ phone, branchId, isDeleted: false });
        if (existContact)
            return res
                .status(400)
                .json({ message: "Phone number is already exists!" });
        await customer_1.default.create({
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
        return res.status(200).json({ message: "Customer created successfully" });
    }
    catch (err) {
        next(err);
    }
};
exports.createCustomer = createCustomer;
const getCustomers = async (req, res, next) => {
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
        const customers = await customer_1.default.aggregate(pipeline);
        // Total count for pagination
        const totalCount = await customer_1.default.countDocuments(match);
        return res.status(200).json({
            data: customers,
            totalCount,
            page,
            limit,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getCustomers = getCustomers;
const updateCustomer = async (req, res, next) => {
    try {
        const { customerId, branchId, name, phone, openingBalance, billingInfo, shippingInfo, taxTreatment, trn, note, placeOfSupplay, } = req.body; // allow partial
        const userId = req.user?.id;
        // Validate user
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        if (!customerId) {
            return res.status(400).json({ message: "Customer ID is required!" });
        }
        // Check if customer exists
        const customer = await customer_1.default.findOne({ _id: customerId, isDeleted: false });
        if (!customer) {
            return res.status(404).json({ message: "Customer not found!" });
        }
        // Duplicate phone check if updating phone
        if (phone && phone !== customer.phone) {
            const existContact = await customer_1.default.findOne({
                phone,
                branchId: branchId || customer.branchId,
                _id: { $ne: customerId },
            });
            if (existContact) {
                return res.status(400).json({
                    message: "Phone number already exists for another customer!",
                });
            }
        }
        // Build update object — take new values if given, else keep old
        const updateData = {
            branchId: branchId ?? customer.branchId,
            name: name ?? customer.name,
            phone: phone ?? customer.phone,
            openingBalance: openingBalance ?? customer.openingBalance,
            billingInfo: billingInfo ?? customer.billingInfo,
            shippingInfo: shippingInfo ?? customer.shippingInfo,
            taxTreatment: taxTreatment ?? customer.taxTreatment,
            trn: trn ?? customer.trn,
            note: note ?? customer.note,
            placeOfSupplay: placeOfSupplay ?? customer.placeOfSupplay,
        };
        await customer_1.default.findByIdAndUpdate(customerId, updateData, { new: true });
        return res.status(200).json({
            message: "Customer updated successfully!",
        });
    }
    catch (err) {
        next(err);
    }
};
exports.updateCustomer = updateCustomer;
const deleteCustomer = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { customerId } = req.params;
        // Validate user
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user)
            return res.status(400).json({ message: "User not found!" });
        if (!customerId) {
            return res.status(400).json({ message: "Customer Id is required!" });
        }
        const customer = await customer_1.default.findOne({ _id: customerId });
        if (!customer) {
            return res.status(404).json({ message: "Customer not found!" });
        }
        await customer_1.default.findByIdAndUpdate(customerId, {
            isDeleted: true,
            deletedAt: new Date(),
            deletedById: user._id,
            // deletedBy: user.name,
        });
        return res.status(200).json({
            message: "Customer deleted successfully!",
        });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteCustomer = deleteCustomer;
