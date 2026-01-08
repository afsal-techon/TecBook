"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAsSent = exports.deleteInvoice = exports.getOneInvoice = exports.getALLInvoices = exports.updateInvoice = exports.createInvoice = void 0;
const invoice_1 = __importDefault(require("../../models/invoice"));
const user_1 = __importDefault(require("../../models/user"));
const customer_1 = __importDefault(require("../../models/customer"));
const imageKit_1 = require("../../config/imageKit");
const mongoose_1 = require("mongoose");
const branch_1 = __importDefault(require("../../models/branch"));
const mongoose_2 = __importDefault(require("mongoose"));
const numberSetting_1 = __importDefault(require("../../models/numberSetting"));
const salesPerson_1 = __importDefault(require("../../models/salesPerson"));
const tax_1 = __importDefault(require("../../models/tax"));
const quotation_1 = __importDefault(require("../../models/quotation"));
const project_1 = __importDefault(require("../../models/project"));
const project_2 = __importDefault(require("../../models/project"));
const http_status_1 = require("../../constants/http-status");
const createInvoice = async (req, res, next) => {
    try {
        const { branchId, invoiceId, // may be null/ignored in auto mode
        customerId, salesPersonId, projectId, invoiceDate, quoteId, dueDate, status, orderNumber, subject, items, paymentTerms, terms, note, subTotal, taxTotal, total, discountValue, } = req.body;
        const userId = req.user?.id;
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        if (!branchId)
            return res.status(400).json({ message: "Branch ID is required!" });
        if (!customerId)
            return res.status(400).json({ message: "Customer ID is required!" });
        if (!invoiceDate)
            return res.status(400).json({ message: "Invoice Date is required!" });
        if (!dueDate)
            return res.status(400).json({ message: "Due Date is required!" });
        if (!status)
            return res.status(400).json({ message: "Status is required!" });
        if (!paymentTerms) {
            return res.status(400).json({ message: "Payment Terms is required!" });
        }
        const customer = await customer_1.default.findOne({
            _id: customerId,
            isDeleted: false,
        });
        if (!customer) {
            return res.status(400).json({ message: "Customer not found!" });
        }
        if (salesPersonId) {
            const salesPerson = await salesPerson_1.default.findById(salesPersonId);
            if (!salesPerson) {
                return res.status(400).json({ message: "Sales person not found!" });
            }
        }
        let parsedItems = [];
        if (items) {
            if (typeof items === "string") {
                parsedItems = JSON.parse(items); // <-- main step
            }
            else {
                parsedItems = items; // in case it's already object/array
            }
        }
        let parsedTerms = [];
        if (paymentTerms) {
            if (typeof items === "string") {
                parsedTerms = JSON.parse(paymentTerms); // <-- main step
            }
            else {
                parsedTerms = paymentTerms; // in case it's already object/array
            }
        }
        if (!parsedItems ||
            !Array.isArray(parsedItems) ||
            parsedItems.length === 0) {
            return res
                .status(400)
                .json({ message: "At least one payment term is required!" });
        }
        if (isNaN(subTotal))
            return res.status(400).json({ message: "Invalid subTotal" });
        if (isNaN(total))
            return res.status(400).json({ message: "Invalid total" });
        if (isNaN(taxTotal))
            return res.status(400).json({ message: "Invalid taxTotal" });
        //  Get quote number setting for this branch
        let setting = await numberSetting_1.default.findOne({
            branchId: new mongoose_1.Types.ObjectId(branchId),
            docType: "INVOICE",
        });
        let finalQuoteId;
        if (setting && setting.mode === "Auto") {
            // ---------- AUTO MODE ----------
            const raw = setting.nextNumberRaw ?? String(setting.nextNumber ?? 1);
            const numeric = setting.nextNumber ?? Number(raw) ?? 1;
            const length = raw.length;
            const padded = String(numeric).padStart(length, "0");
            finalQuoteId = `${setting.prefix}${padded}`;
            // optionally: ensure uniqueness
            const exists = await invoice_1.default.findOne({
                branchId: new mongoose_1.Types.ObjectId(branchId),
                invoiceId: finalQuoteId,
                isDeleted: false,
            });
            if (exists) {
                return res.status(400).json({
                    message: "Generated invoice Id already exists. Please try again.",
                });
            }
            // increment for next time
            setting.nextNumber = numeric + 1;
            setting.nextNumberRaw = String(numeric + 1).padStart(length, "0");
            await setting.save();
        }
        else {
            // ---------- MANUAL MODE ----------
            if (!invoiceId || typeof invoiceId !== "string" || !invoiceId.trim()) {
                return res
                    .status(400)
                    .json({ message: "Invoice Id is required in manual mode!" });
            }
            finalQuoteId = invoiceId.trim();
            // ensure unique
            const exists = await invoice_1.default.findOne({
                branchId: new mongoose_1.Types.ObjectId(branchId),
                invoiceId: finalQuoteId,
                isDeleted: false,
            });
            if (exists) {
                return res.status(400).json({
                    message: "This invoice Id already exists. Please enter a different one.",
                });
            }
        }
        //  Upload attached documents if any
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
        for (let item of parsedItems) {
            if (!item.itemName ||
                !item.qty ||
                !item.rate ||
                !item.amount ||
                !item.unit) {
                return res.status(400).json({ message: "Invalid item data!" });
            }
            let taxAmount = 0;
            // TAX CALCULATION (Backend Controlled)
            if (item.taxId) {
                const taxDoc = await tax_1.default.findOne({
                    _id: item.taxId,
                    isDeleted: false,
                    isActive: true,
                });
                if (!taxDoc) {
                    return res.status(400).json({
                        message: `Invalid tax selected for item ${item.itemName}`,
                    });
                }
                const taxableAmount = Number(item.rate) * Number(item.qty || 1);
                if (taxDoc.type === "VAT") {
                    taxAmount = (taxableAmount * (taxDoc.vatRate || 0)) / 100;
                }
                if (taxDoc.type === "GST") {
                    const totalGstRate = (taxDoc.cgstRate || 0) + (taxDoc.sgstRate || 0);
                    taxAmount = (taxableAmount * totalGstRate) / 100;
                }
            }
            item.tax = Number(taxAmount.toFixed(2));
        }
        let quotation;
        if (quoteId) {
            quotation = await quotation_1.default.findById(quoteId);
            if (!quotation) {
                return res.status(400).json({ message: "Quotation not found!" });
            }
        }
        if (projectId) {
            const project = await project_1.default.findById(projectId);
            if (!project) {
                return res.status(400).json({ message: "Project not found!" });
            }
        }
        const invoice = new invoice_1.default({
            branchId: new mongoose_1.Types.ObjectId(branchId),
            invoiceId: finalQuoteId, //  always use this
            customerId: new mongoose_1.Types.ObjectId(customerId),
            projectId: projectId ? new mongoose_1.Types.ObjectId(projectId) : null,
            salesPersonId: salesPersonId ? new mongoose_1.Types.ObjectId(salesPersonId) : null,
            invoiceDate,
            dueDate,
            quoteId: quoteId ? new mongoose_1.Types.ObjectId(quoteId) : null,
            status,
            items: parsedItems,
            paymentTerms: parsedTerms,
            terms,
            orderNumber,
            subject,
            subTotal,
            taxTotal,
            total,
            discount: discountValue,
            documents: uploadedFiles,
            note,
            createdById: userId,
        });
        await invoice.save();
        if (quotation) {
            quotation.status = "Invoiced";
            await quotation.save();
        }
        return res.status(201).json({
            message: `Invoice created successfully.`,
            invoiceId: finalQuoteId,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.createInvoice = createInvoice;
const updateInvoice = async (req, res, next) => {
    try {
        const { invoiceId } = req.params;
        const { branchId, customerId, projectId, salesPersonId, invoiceDate, dueDate, quoteId, status, items, subTotal, terms, paymentTerms, orderNumber, subject, note, taxTotal, total, discountValue, existingDocuments, } = req.body;
        const userId = req.user?.id;
        // Validate user
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user)
            return res.status(400).json({ message: "User not found!" });
        // Validate saleOrderId
        if (!invoiceId)
            return res.status(400).json({ message: "Invoice Id is required!" });
        const invoice = await invoice_1.default.findOne({
            _id: invoiceId,
            isDeleted: false,
        });
        if (!invoice)
            return res.status(400).json({ message: "Invoice not found!" });
        // Required fields
        if (!branchId)
            return res.status(400).json({ message: "Branch ID is required!" });
        if (!customerId)
            return res.status(400).json({ message: "Customer ID is required!" });
        if (!invoiceDate)
            return res.status(400).json({ message: "Invoice date is required!" });
        if (!dueDate)
            return res.status(400).json({ message: "Due  date is required!" });
        if (!status)
            return res.status(400).json({ message: "Status is required!" });
        // Validate customer
        const customer = await customer_1.default.findOne({
            _id: customerId,
            isDeleted: false,
        });
        if (!customer)
            return res.status(400).json({ message: "Customer not found!" });
        // -----------------------------
        // Parse ITEMS
        // -----------------------------
        let parsedItems = [];
        if (items) {
            parsedItems = typeof items === "string" ? JSON.parse(items) : items;
        }
        if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
            return res.status(400).json({
                message: "At least one item is required!",
            });
        }
        if (!paymentTerms) {
            return res.status(400).json({ message: "Payment term  is required!" });
        }
        const rawTerms = typeof paymentTerms === "string"
            ? JSON.parse(paymentTerms)
            : paymentTerms;
        if (!rawTerms || typeof rawTerms !== "object") {
            return res.status(400).json({ message: "Invalid payment term format!" });
        }
        if (!rawTerms._id) {
            return res.status(400).json({ message: "payment term Id is required!" });
        }
        if (!rawTerms.termName || !String(rawTerms.termName).trim()) {
            return res.status(400).json({ message: "Term name is required!" });
        }
        if (rawTerms.days == null || isNaN(Number(rawTerms.days))) {
            return res.status(400).json({ message: "Valid days is required!" });
        }
        const parsedTerms = {
            _id: String(rawTerms._id),
            termName: String(rawTerms.termName).trim(),
            days: Number(rawTerms.days),
        };
        let finalDocuments = [];
        if (existingDocuments) {
            const parsedDocs = Array.isArray(existingDocuments)
                ? existingDocuments
                : JSON.parse(existingDocuments);
            finalDocuments = parsedDocs
                .map((doc) => (typeof doc === "string" ? doc : doc.doc_file))
                .filter((d) => !!d);
        }
        // New uploads
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
        for (let item of parsedItems) {
            if (!item.itemName ||
                !item.qty ||
                !item.rate ||
                !item.amount ||
                !item.unit) {
                return res.status(400).json({ message: "Invalid item data!" });
            }
            let taxAmount = 0;
            // TAX CALCULATION (Backend Controlled)
            if (item.taxId) {
                const taxDoc = await tax_1.default.findOne({
                    _id: item.taxId,
                    isDeleted: false,
                    isActive: true,
                });
                if (!taxDoc) {
                    return res.status(400).json({
                        message: `Invalid tax selected for item ${item.itemName}`,
                    });
                }
                const taxableAmount = Number(item.rate) * Number(item.qty || 1);
                if (taxDoc.type === "VAT") {
                    taxAmount = (taxableAmount * (taxDoc.vatRate || 0)) / 100;
                }
                if (taxDoc.type === "GST") {
                    const totalGstRate = (taxDoc.cgstRate || 0) + (taxDoc.sgstRate || 0);
                    taxAmount = (taxableAmount * totalGstRate) / 100;
                }
            }
            item.tax = Number(taxAmount.toFixed(2));
        }
        let quotation;
        if (quoteId) {
            quotation = await quotation_1.default.findById(quoteId);
            if (!quotation) {
                return res.status(400).json({ message: "Quotation not found!" });
            }
        }
        if (projectId) {
            const project = await project_1.default.findById(projectId);
            if (!project) {
                return res.status(400).json({ message: "Project not found!" });
            }
        }
        invoice.branchId = branchId;
        invoice.customerId = customerId;
        invoice.projectId = projectId;
        invoice.salesPersonId = salesPersonId || null;
        invoice.invoiceDate = invoiceDate;
        invoice.dueDate = dueDate;
        invoice.status = status;
        invoice.quoteId = quoteId;
        invoice.items = parsedItems;
        invoice.paymentTerms = parsedTerms; // now always assigned
        invoice.terms = terms;
        invoice.subTotal = subTotal;
        invoice.subject = subject;
        invoice.taxTotal = taxTotal;
        invoice.orderNumber = orderNumber;
        invoice.total = total;
        invoice.discount = discountValue;
        invoice.documents = finalDocuments;
        invoice.note = note;
        await invoice.save();
        if (quotation) {
            quotation.status = "Invoiced";
            await quotation.save();
        }
        return res.status(200).json({
            message: "Invoice updated successfully.",
        });
    }
    catch (err) {
        next(err);
    }
};
exports.updateInvoice = updateInvoice;
const getALLInvoices = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        // 🔹 Validate user
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user)
            return res.status(400).json({ message: "User not found!" });
        const userRole = user.role; // "CompanyAdmin" or "User"
        const filterBranchId = req.query.branchId;
        const search = (req.query.search || "").trim();
        const projectId = req.query.projectId;
        // Date filters
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;
        const statusFilter = req.query.status || "";
        const allowedStatuses = [
            "Draft",
            "Accepted",
            "Approved",
            "Sent",
            "Invoiced",
            "Pending",
            "Paid",
            "Declined",
        ];
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
                    message: "You are not authorized to view invoice for this branch!",
                });
            }
            allowedBranchIds = [filterId];
        }
        // 🔹 Base match condition
        const matchStage = {
            branchId: { $in: allowedBranchIds },
            isDeleted: false,
        };
        if (projectId) {
            if (!mongoose_1.Types.ObjectId.isValid(projectId)) {
                return res.status(400).json({ message: "Invalid project ID!" });
            }
            const validateProject = await project_2.default.findOne({
                _id: projectId,
                isDeleted: false,
            });
            if (!validateProject) {
                return res
                    .status(http_status_1.HTTP_STATUS.BAD_REQUEST)
                    .json({ message: "Project not found!" });
            }
            matchStage.projectId = new mongoose_1.Types.ObjectId(projectId);
        }
        // 🔹 Date filter (quoteDate)
        if (startDate && endDate) {
            matchStage.quoteDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }
        else if (startDate) {
            matchStage.quoteDate = { $gte: new Date(startDate) };
        }
        else if (endDate) {
            matchStage.quoteDate = { $lte: new Date(endDate) };
        }
        if (statusFilter && allowedStatuses.includes(statusFilter)) {
            matchStage.status = statusFilter;
        }
        // 🔹 Pipeline
        const pipeline = [
            { $match: matchStage },
            // Join Customer
            {
                $lookup: {
                    from: "customers",
                    localField: "customerId",
                    foreignField: "_id",
                    as: "customer",
                },
            },
            { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
            // Join Sales Person (user)
            {
                $lookup: {
                    from: "salespeople",
                    localField: "salesPersonId",
                    foreignField: "_id",
                    as: "salesPerson",
                },
            },
            { $unwind: { path: "$salesPerson", preserveNullAndEmptyArrays: true } },
        ];
        // 🔹 Search
        if (search.length > 0) {
            pipeline.push({
                $match: {
                    $or: [
                        { invoiceId: { $regex: search, $options: "i" } },
                        { "customer.name": { $regex: search, $options: "i" } },
                        // { "customer.email": { $regex: search, $options: "i" } },
                        // { "salesPerson.name": { $regex: search, $options: "i" } },
                    ],
                },
            });
        }
        // 🔹 Count total after filters
        const countPipeline = [...pipeline, { $count: "total" }];
        const countResult = await invoice_1.default.aggregate(countPipeline);
        const totalCount = countResult[0]?.total || 0;
        // 🔹 Pagination + sorting
        pipeline.push({ $sort: { createdAt: -1 } });
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: limit });
        // 🔹 Project fields
        pipeline.push({
            $project: {
                quoteId: 1,
                branchId: 1,
                customerId: 1,
                projectId: 1,
                invoiceId: 1,
                invoiceDate: 1,
                dueDate: 1,
                status: 1,
                subTotal: 1,
                terms: 1,
                taxTotal: 1,
                orderNumber: 1,
                subject: 1,
                total: 1,
                discount: 1,
                documents: 1,
                createdAt: 1,
                "customer.name": 1,
                "customer.email": 1,
                "salesPerson.name": 1,
                "salesPerson.email": 1,
            },
        });
        // 🔹 Execute
        const invoices = await invoice_1.default.aggregate(pipeline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const overdueEligibleStatuses = ["Sent", "Invoiced"];
        const invoicesWithOverdue = invoices.map((invoice) => {
            let overdueDays = 0;
            let displayStatus = invoice.status;
            if (invoice.dueDate) {
                const dueDate = new Date(invoice.dueDate);
                dueDate.setHours(0, 0, 0, 0);
                if (overdueEligibleStatuses.includes(invoice.status) &&
                    today > dueDate) {
                    overdueDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                    displayStatus = `Overdue by ${overdueDays} day${overdueDays > 1 ? "s" : ""}`;
                }
            }
            return {
                ...invoice,
                overdueDays,
                isOverdue: overdueDays > 0,
                displayStatus,
            };
        });
        //  YOU MUST RETURN RESPONSE
        return res.status(200).json({
            data: invoicesWithOverdue,
            totalCount,
            page,
            limit,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getALLInvoices = getALLInvoices;
const getOneInvoice = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { invoiceId } = req.params; // assuming /quotes/:id
        // 1) Validate ID
        if (!invoiceId || !mongoose_1.Types.ObjectId.isValid(invoiceId)) {
            return res.status(400).json({ message: "Invalid Invoice Id!" });
        }
        const saleObjectId = new mongoose_1.Types.ObjectId(invoiceId);
        // 2) Validate user
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        // 4) Aggregation pipeline
        const pipeline = [
            {
                $match: {
                    _id: saleObjectId,
                    // branchId: { $in: allowedBranchIds },
                    isDeleted: false,
                },
            },
            // Join Customer
            {
                $lookup: {
                    from: "customers",
                    localField: "customerId",
                    foreignField: "_id",
                    as: "customer",
                },
            },
            { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
            // Join Sales Person (user)
            {
                $lookup: {
                    from: "salespeople",
                    localField: "salesPersonId",
                    foreignField: "_id",
                    as: "salesPerson",
                },
            },
            { $unwind: { path: "$salesPerson", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "items",
                    localField: "items.itemId",
                    foreignField: "_id",
                    as: "itemDetails",
                },
            },
            {
                $project: {
                    _id: 1,
                    branchId: 1,
                    invoiceId: 1,
                    projectId: 1,
                    customerId: 1,
                    paymentTermsId: 1,
                    salesPersonId: 1,
                    invoiceDate: 1,
                    dueDate: 1,
                    status: 1,
                    subTotal: 1,
                    orderNumber: 1,
                    subject: 1,
                    taxTotal: 1,
                    total: 1,
                    discount: 1,
                    documents: 1,
                    note: 1,
                    terms: 1,
                    paymentTerms: 1, // full items array as saved
                    createdAt: 1,
                    updatedAt: 1,
                    items: {
                        $map: {
                            input: "$items",
                            as: "it",
                            in: {
                                itemId: "$$it.itemId",
                                taxId: "$$it.taxId",
                                qty: "$$it.qty",
                                tax: "$$it.tax",
                                rate: "$$it.rate",
                                amount: "$$it.amount",
                                unit: "$$it.unit",
                                discount: "$$it.discount",
                                itemName: {
                                    $let: {
                                        vars: {
                                            matchedItem: {
                                                $first: {
                                                    $filter: {
                                                        input: "$itemDetails",
                                                        as: "id",
                                                        cond: { $eq: ["$$id._id", "$$it.itemId"] },
                                                    },
                                                },
                                            },
                                        },
                                        in: "$$matchedItem.name",
                                    },
                                },
                            },
                        },
                    },
                    // customer fields
                    customer: {
                        _id: "$customer._id",
                        name: "$customer.name",
                        phone: "$customer.phone",
                        email: "$customer.email",
                        billingInfo: "$customer.billingInfo",
                        shippingInfo: "$customer.shippingInfo",
                        taxTreatment: "$customer.taxTreatment",
                        trn: "$customer.trn",
                    },
                    // sales person fields
                    salesPerson: {
                        _id: "$salesPerson._id",
                        name: "$salesPerson.name",
                        email: "$salesPerson.email",
                    },
                },
            },
        ];
        const result = await invoice_1.default.aggregate(pipeline);
        if (!result || result.length === 0) {
            return res.status(404).json({ message: "Invoice not found!" });
        }
        const invoice = result[0];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let overdueDays = 0;
        let displayStatus = invoice.status;
        if (invoice.dueDate) {
            const dueDate = new Date(invoice.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            if (invoice.status !== "Paid" &&
                invoice.status !== "Cancelled" &&
                today > dueDate) {
                overdueDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                displayStatus = `Overdue by ${overdueDays} day${overdueDays > 1 ? "s" : ""}`;
            }
        }
        // Final response
        return res.status(200).json({
            data: {
                ...invoice,
                overdueDays,
                isOverdue: overdueDays > 0,
                displayStatus,
            },
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getOneInvoice = getOneInvoice;
const deleteInvoice = async (req, res, next) => {
    try {
        const { invoiceId } = req.params;
        const userId = req.user?.id;
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        if (!invoiceId) {
            return res.status(400).json({ message: "Invoice Id is required!" });
        }
        const invoice = await invoice_1.default.findOne({ _id: invoiceId });
        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found!" });
        }
        // const itemExist = await ITEMS.findOne({
        //   quoteId: quoteId,
        //   isDeleted: false,
        // });
        // if (itemExist) {
        //   return res.status(400).json({
        //     message:
        //       "This category currently linked to Items. Please remove Items before deleting.",
        //   });
        // }
        await invoice_1.default.findByIdAndUpdate(invoiceId, {
            isDeleted: true,
            deletedAt: new Date(),
            deletedById: user._id,
            deletedBy: user.username,
        });
        return res.status(200).json({
            message: "Invoice deleted successfully!",
        });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteInvoice = deleteInvoice;
const markAsSent = async (req, res, next) => {
    try {
        let { invoiceId, status } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        if (!invoiceId) {
            return res.status(400).json({ message: "Invoice Id is required!" });
        }
        const invoice = await invoice_1.default.findOne({ _id: invoiceId });
        if (!invoice) {
            return res.status(404).json({ message: "invoice not found!" });
        }
        if (!status) {
            return res.status(400).json({ message: "Status is required!" });
        }
        // normalize / validate status
        status = String(status);
        if (status !== "Sent") {
            return res.status(400).json({ message: "Status must be 'Sent'" });
        }
        invoice.status = status;
        await invoice.save(); // <-- important
        return res.status(200).json({
            message: "Invoice marked as Sent",
        });
    }
    catch (err) {
        next(err);
    }
};
exports.markAsSent = markAsSent;
