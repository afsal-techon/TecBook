"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSalesPerson = exports.getSalesPerson = exports.updateSalesPerson = exports.createSalesPerson = void 0;
const salesPerson_1 = __importDefault(require("../../models/salesPerson"));
const user_1 = __importDefault(require("../../models/user"));
const createSalesPerson = async (req, res, next) => {
    try {
        const { branchId, name, email } = req.body;
        const userId = req.user?.id;
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        if (!branchId) {
            return res.status(400).json({ message: "Branch ID is required!" });
        }
        if (!name) {
            return res.status(400).json({ message: "Name  is required!" });
        }
        if (!email) {
            return res.status(400).json({ message: "Email ID is required!" });
        }
        const existEmail = await salesPerson_1.default.findOne({
            email,
            branchId,
            isDeleted: false,
        });
        if (existEmail)
            return res.status(400).json({ message: "Email is already exists!" });
        await salesPerson_1.default.create({
            branchId,
            name,
            email,
            createdById: user._id,
        });
        return res.status(200).json({ message: "Sales person created successfully" });
    }
    catch (err) {
        next(err);
    }
};
exports.createSalesPerson = createSalesPerson;
const updateSalesPerson = async (req, res, next) => {
    try {
        const { branchId, name, email, } = req.body; // allow partial
        const userId = req.user?.id;
        const { salesPersonId } = req.params;
        // Validate user
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        if (!salesPersonId) {
            return res.status(400).json({ message: "SalesPerson id is required!" });
        }
        // Check if customer exists
        const salesPerson = await salesPerson_1.default.findOne({
            _id: salesPersonId,
            isDeleted: false,
        });
        if (!salesPerson) {
            return res.status(404).json({ message: "Sales person not found!" });
        }
        if (email && email !== salesPerson.email) {
            const existPhone = await salesPerson_1.default.findOne({
                email,
                branchId: branchId || salesPerson.branchId,
                _id: { $ne: salesPersonId },
            });
            if (existPhone) {
                return res.status(400).json({
                    message: "Email already exists for another sales person!",
                });
            }
        }
        // Build update object — take new values if given, else keep old
        const updateData = {
            branchId: branchId ?? salesPerson.branchId,
            name: name ?? salesPerson.name,
            email: email ?? salesPerson.email,
        };
        await salesPerson_1.default.findByIdAndUpdate(salesPersonId, updateData, { new: true });
        await salesPerson.save();
        return res.status(200).json({
            message: "Sales person updated successfully!",
        });
    }
    catch (err) {
        next(err);
    }
};
exports.updateSalesPerson = updateSalesPerson;
const getSalesPerson = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { branchId } = req.params;
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        const salesPerson = await salesPerson_1.default.find({ branchId, isDeleted: false });
        return res.status(200).json({
            data: salesPerson
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getSalesPerson = getSalesPerson;
const deleteSalesPerson = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { salesPersonId } = req.params;
        // Validate user
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user)
            return res.status(400).json({ message: "User not found!" });
        if (!salesPersonId) {
            return res.status(400).json({ message: "Sales person Id is required!" });
        }
        const customer = await salesPerson_1.default.findOne({ _id: salesPersonId });
        if (!customer) {
            return res.status(404).json({ message: "Sales person not found!" });
        }
        await salesPerson_1.default.findByIdAndUpdate(salesPersonId, {
            isDeleted: true,
            deletedAt: new Date(),
            deletedById: user._id,
            // deletedBy: user.name,
        });
        return res.status(200).json({
            message: "Sales person deleted successfully!",
        });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteSalesPerson = deleteSalesPerson;
