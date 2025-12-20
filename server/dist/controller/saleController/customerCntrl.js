"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCustomer = exports.updateCustomer = exports.getCustomersDetails = exports.getCustomers = exports.createCustomer = void 0;
const customer_1 = __importDefault(require("../../models/customer"));
const user_1 = __importDefault(require("../../models/user"));
const mongoose_1 = require("mongoose");
const mongoose_2 = __importDefault(require("mongoose"));
const imageKit_1 = require("../../config/imageKit");
const branch_1 = __importDefault(require("../../models/branch"));
const createCustomer = async (req, res, next) => {
    try {
        const { branchId, name, phone, note, openingBalance, email, currency, paymentTerms, taxTreatment, trn, placeOfSupplay, } = req.body;
        const userId = req.user?.id;
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        if (!branchId) {
            return res.status(400).json({ message: "Branch ID is required!" });
        }
        if (typeof req.body.billingInfo === 'string') {
            req.body.billingInfo = JSON.parse(req.body.billingInfo);
        }
        if (typeof req.body.shippingInfo === 'string') {
            req.body.shippingInfo = JSON.parse(req.body.shippingInfo);
        }
        if (!name) {
            return res.status(400).json({ message: "Name is required!" });
        }
        if (!phone) {
            return res.status(400).json({ message: "Phone number is required!" });
        }
        if (!req.body.billingInfo) {
            return res.status(400).json({ message: "Billing address is required!" });
        }
        if (!req.body.shippingInfo) {
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
        const existContact = await customer_1.default.findOne({
            phone,
            branchId,
            isDeleted: false,
        });
        if (existContact)
            return res
                .status(400)
                .json({ message: "Phone number is already exists!" });
        const existEmail = await customer_1.default.findOne({
            email,
            branchId,
            isDeleted: false,
        });
        if (existEmail)
            return res.status(400).json({ message: "Email is already exists!" });
        let uploadedDocuments = [];
        const documentsMetadata = req.body.metadata
            ? JSON.parse(req.body.metadata)
            : [];
        if (req.files && Array.isArray(req.files)) {
            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                const meta = documentsMetadata[i] || {}; // fallback in case metadata missing
                const uploadResponse = await imageKit_1.imagekit.upload({
                    file: file.buffer.toString("base64"),
                    fileName: file.originalname,
                    folder: "/images",
                });
                uploadedDocuments.push({
                    doc_name: meta.doc_name || file.originalname,
                    doc_file: uploadResponse.url,
                    doc_typeId: meta.doc_typeId
                        ? new mongoose_1.Types.ObjectId(meta.doc_typeId)
                        : null,
                    startDate: meta.startDate,
                    endDate: meta.endDate,
                });
            }
        }
        await customer_1.default.create({
            branchId,
            name,
            phone,
            openingBalance,
            billingInfo: req.body.billingInfo,
            shippingInfo: req.body.shippingInfo,
            taxTreatment,
            trn,
            email,
            note,
            paymentTerms,
            currency,
            placeOfSupplay,
            createdById: user._id,
            documents: uploadedDocuments,
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
        // 🔹 Validate user
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        const userRole = user.role; // "CompanyAdmin" or "User"
        const filterBranchId = req.query.branchId; // optional
        const search = (req.query.search || "").trim();
        // Pagination
        const limit = parseInt(req.query.limit) || 20;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        // 🔹 Determine allowed branches
        let allowedBranchIds = [];
        if (userRole === "CompanyAdmin") {
            const branches = await branch_1.default.find({
                companyAdminId: userId,
                isDeleted: false,
            }).select("_id");
            allowedBranchIds = branches.map((b) => new mongoose_2.default.Types.ObjectId(b._id));
        }
        else if (userRole === "User") {
            if (!user.branchId) {
                return res
                    .status(400)
                    .json({ message: "User is not assigned to any branch!" });
            }
            allowedBranchIds = [user.branchId];
        }
        else {
            return res.status(403).json({ message: "Unauthorized role!" });
        }
        // 🔹 Apply branch filter if passed
        if (filterBranchId) {
            const filterId = new mongoose_2.default.Types.ObjectId(filterBranchId);
            if (!allowedBranchIds.some((id) => id.equals(filterId))) {
                return res.status(403).json({
                    message: "You are not authorized to view customers for this branch!",
                });
            }
            allowedBranchIds = [filterId];
        }
        // 🔹 Build aggregation pipeline
        const pipeline = [
            {
                $match: {
                    branchId: { $in: allowedBranchIds },
                    isDeleted: false,
                },
            },
            // 🔹 Lookup Document Types for each document in documents array
            {
                $lookup: {
                    from: "documenttypes",
                    localField: "documents.doc_typeId",
                    foreignField: "_id",
                    as: "docTypeDetails",
                },
            },
            {
                $addFields: {
                    documents: {
                        $map: {
                            input: "$documents",
                            as: "doc",
                            in: {
                                doc_name: "$$doc.doc_name",
                                doc_file: "$$doc.doc_file",
                                doc_typeId: "$$doc.doc_typeId",
                                doc_type: {
                                    $let: {
                                        vars: {
                                            matched: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$docTypeDetails",
                                                            as: "d",
                                                            cond: { $eq: ["$$d._id", "$$doc.doc_typeId"] },
                                                        },
                                                    },
                                                    0,
                                                ],
                                            },
                                        },
                                        in: "$$matched.doc_type",
                                    },
                                },
                            },
                        },
                    },
                },
            },
            { $unset: "docTypeDetails" },
        ];
        // 🔹 Search filter
        if (search.length > 0) {
            pipeline.push({
                $match: {
                    $or: [
                        { name: { $regex: search, $options: "i" } },
                        { phone: { $regex: search, $options: "i" } },
                        { trn: { $regex: search, $options: "i" } },
                        { placeOfSupplay: { $regex: search, $options: "i" } },
                    ],
                },
            });
        }
        // 🔹 Count total after filters
        const countPipeline = [...pipeline, { $count: "total" }];
        const countResult = await customer_1.default.aggregate(countPipeline);
        const totalCount = countResult[0]?.total || 0;
        // 🔹 Pagination & projection
        pipeline.push({ $sort: { createdAt: -1 } });
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: limit });
        pipeline.push({
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
                currency: 1,
                paymentTerms: 1,
                email: 1,
                placeOfSupplay: 1,
                documents: 1,
                createdAt: 1,
                updatedAt: 1,
            },
        });
        // 🔹 Execute
        const customers = await customer_1.default.aggregate(pipeline);
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
const getCustomersDetails = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { branchId } = req.params;
        // 🔹 Validate user
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        const customers = await customer_1.default.find({ branchId, isDeleted: false });
        return res.status(200).json({
            data: customers,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getCustomersDetails = getCustomersDetails;
const updateCustomer = async (req, res, next) => {
    try {
        const { customerId, branchId, name, phone, openingBalance, taxTreatment, trn, email, note, currency, paymentTerms, placeOfSupplay, existingDocuments } = req.body; // allow partial
        const userId = req.user?.id;
        // Validate user
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        if (typeof req.body.billingInfo === 'string') {
            req.body.billingInfo = JSON.parse(req.body.billingInfo);
        }
        if (typeof req.body.shippingInfo === 'string') {
            req.body.shippingInfo = JSON.parse(req.body.shippingInfo);
        }
        if (!customerId) {
            return res.status(400).json({ message: "Customer ID is required!" });
        }
        // Check if customer exists
        const customer = await customer_1.default.findOne({
            _id: customerId,
            isDeleted: false,
        });
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
        if (email && email !== customer.email) {
            const existPhone = await customer_1.default.findOne({
                email,
                branchId: branchId || customer.branchId,
                _id: { $ne: customerId },
            });
            if (existPhone) {
                return res.status(400).json({
                    message: "Phone number already exists for another customer!",
                });
            }
        }
        let finalDocuments = [];
        if (existingDocuments) {
            // front-end sends existingDocuments as JSON string
            const parsedExistingDocs = Array.isArray(existingDocuments)
                ? existingDocuments
                : JSON.parse(existingDocuments);
            finalDocuments = parsedExistingDocs.map((doc) => ({
                doc_name: doc.doc_name,
                doc_file: doc.doc_file,
                doc_typeId: doc.doc_typeId ? new mongoose_1.Types.ObjectId(doc.doc_typeId) : null,
                startDate: doc.startDate,
                endDate: doc.endDate,
            }));
        }
        const documentsMetadata = req.body.metadata
            ? JSON.parse(req.body.metadata)
            : [];
        if (req.files && Array.isArray(req.files)) {
            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                const meta = documentsMetadata[i] || {};
                const uploadResponse = await imageKit_1.imagekit.upload({
                    file: file.buffer.toString("base64"),
                    fileName: file.originalname,
                    folder: "/images",
                });
                finalDocuments.push({
                    doc_name: meta.doc_name || file.originalname || "",
                    doc_file: uploadResponse.url || "",
                    doc_typeId: meta.doc_typeId ? new mongoose_1.Types.ObjectId(meta.doc_typeId) : null,
                    startDate: meta.startDate,
                    endDate: meta.endDate,
                });
            }
        }
        // Build update object — take new values if given, else keep old
        const updateData = {
            branchId: branchId ?? customer.branchId,
            name: name ?? customer.name,
            phone: phone ?? customer.phone,
            openingBalance: openingBalance ?? customer.openingBalance,
            billingInfo: req.body.billingInfo ?? customer.billingInfo,
            shippingInfo: req.body.shippingInfo ?? customer.shippingInfo,
            taxTreatment: taxTreatment ?? customer.taxTreatment,
            currency: currency ?? customer.currency,
            paymentTerms: paymentTerms ?? customer.paymentTerms,
            trn: trn ?? customer.trn,
            email: email ?? customer.email,
            note: note ?? customer.note,
            placeOfSupplay: placeOfSupplay ?? customer.placeOfSupplay,
        };
        await customer_1.default.findByIdAndUpdate(customerId, updateData, { new: true });
        customer.documents = finalDocuments;
        await customer.save();
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
