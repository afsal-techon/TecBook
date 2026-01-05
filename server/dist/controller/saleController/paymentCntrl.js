"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOnePaymentReceived = exports.updatePaymentReceived = exports.getAllPaymentReceived = exports.createPaymentReceived = void 0;
const user_1 = __importDefault(require("../../models/user"));
const invoice_1 = __importDefault(require("../../models/invoice"));
const paymentRecieved_1 = __importDefault(require("../../models/paymentRecieved"));
const imageKit_1 = require("../../config/imageKit");
const mongoose_1 = require("mongoose");
const branch_1 = __importDefault(require("../../models/branch"));
const mongoose_2 = __importDefault(require("mongoose"));
const accounts_1 = __importDefault(require("../../models/accounts"));
const transactionHelper_1 = require("../../Helper/transactionHelper");
const transactions_1 = __importDefault(require("../../models/transactions"));
const paymentMode_1 = __importDefault(require("../../models/paymentMode"));
const numberSetting_1 = __importDefault(require("../../models/numberSetting"));
const createPaymentReceived = async (req, res, next) => {
    try {
        const { branchId, customerId, invoiceId, paymentId, paymentDate, amount, accountId, bankCharges = 0, paymentMode, reference, note, status, } = req.body;
        console.log(status, 'states');
        const userId = req.user?.id;
        let invoice = null;
        // 1️ Basic validations
        if (!userId) {
            return res.status(401).json({ message: "User not found!" });
        }
        if (!branchId || !mongoose_1.Types.ObjectId.isValid(branchId)) {
            return res.status(400).json({ message: "Invalid Branch Id!" });
        }
        if (!customerId || !mongoose_1.Types.ObjectId.isValid(customerId)) {
            return res.status(400).json({ message: "Invalid Customer Id!" });
        }
        if (!paymentId) {
            return res.status(400).json({ message: "Payment Id is required!" });
        }
        if (!paymentDate || typeof paymentDate !== "string") {
            return res.status(400).json({ message: "Payment Date is required!" });
        }
        if (accountId && !mongoose_1.Types.ObjectId.isValid(accountId)) {
            return res.status(400).json({ message: "Invalid Account Id!" });
        }
        if (!paymentMode) {
            return res.status(400).json({ message: "Invalid paymentMode!" });
        }
        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            return res.status(400).json({ message: "Invalid amount!" });
        }
        if (Number(bankCharges) < 0 || Number(bankCharges) > Number(amount)) {
            return res.status(400).json({ message: "Invalid bank charges!" });
        }
        if (!status || !["Draft", "Paid"].includes(status)) {
            return res.status(400).json({ message: "Invalid status!" });
        }
        //  Get quote number setting for this branch
        let setting = await numberSetting_1.default.findOne({
            branchId: new mongoose_1.Types.ObjectId(branchId),
            docType: "PAYMENT",
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
            const exists = await paymentRecieved_1.default.findOne({
                branchId: new mongoose_1.Types.ObjectId(branchId),
                paymentId: finalQuoteId,
                isDeleted: false,
            });
            if (exists) {
                return res.status(400).json({
                    message: "Generated payment Id already exists. Please try again.",
                });
            }
            // increment for next time
            setting.nextNumber = numeric + 1;
            setting.nextNumberRaw = String(numeric + 1).padStart(length, "0");
            await setting.save();
        }
        else {
            // ---------- MANUAL MODE ----------
            if (!paymentId || typeof paymentId !== "string" || !paymentId.trim()) {
                return res
                    .status(400)
                    .json({ message: "PaymentId Id is required in manual mode!" });
            }
            finalQuoteId = paymentId.trim();
            // ensure unique
            const exists = await paymentRecieved_1.default.findOne({
                branchId: new mongoose_1.Types.ObjectId(branchId),
                paymentId: finalQuoteId,
                isDeleted: false,
            });
            if (exists) {
                return res.status(400).json({
                    message: "This payment Id already exists. Please enter a different one.",
                });
            }
        }
        // 2️ Find invoice (optional but validated)
        if (invoiceId) {
            console.log(invoiceId, 'invoice');
            invoice = await invoice_1.default.findOne({
                branchId: new mongoose_1.Types.ObjectId(branchId),
                _id: invoiceId,
                isDeleted: false,
            });
            if (!invoice) {
                return res.status(404).json({ message: "Invoice not found!" });
            }
        }
        // 3️ Validate payment account (Bank / Cash)
        const paymentAccount = await paymentMode_1.default.findOne({
            branchId: new mongoose_1.Types.ObjectId(branchId),
            "paymentModes.paymentMode": paymentMode,
            isDeleted: false,
        });
        if (!paymentAccount) {
            return res.status(400).json({ message: "Payment account not found!" });
        }
        // 4️ Get Sales account
        const salesAccount = await accounts_1.default.findOne({
            branchId: new mongoose_1.Types.ObjectId(branchId),
            _id: accountId,
            isDeleted: false,
        });
        if (!salesAccount) {
            return res.status(400).json({ message: "Account not found!" });
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
        // 5️ Create Payment Received
        const payment = await paymentRecieved_1.default.create({
            branchId: new mongoose_1.Types.ObjectId(branchId),
            customerId: new mongoose_1.Types.ObjectId(customerId),
            invoiceId: invoiceId || null,
            projectId: invoice?.projectId || null,
            paymentId: finalQuoteId,
            paymentDate,
            paymentRecieved: new Date(),
            amount,
            bankCharges,
            accountId: salesAccount._id,
            paymentMode,
            reference,
            note,
            documents: uploadedFiles,
            status,
            createdById: new mongoose_1.Types.ObjectId(userId),
        });
        // 6️ If Draft → stop here
        if (status === "Draft") {
            return res.status(201).json({
                message: "Payment saved as draft",
                paymentId,
            });
        }
        // 8️ Sales → Credit
        await (0, transactionHelper_1.createTransaction)({
            branchId: new mongoose_1.Types.ObjectId(branchId),
            paymentId: payment._id,
            paymentMode: paymentMode,
            accountId: salesAccount._id,
            transactionType: "Credit",
            amount: Number(amount),
            reference: paymentId,
            transactionDate: new Date(),
            description: "Invoice payment received",
            customerId: new mongoose_1.Types.ObjectId(customerId),
            createdById: new mongoose_1.Types.ObjectId(userId),
        });
        // 9️ Update invoice status (only if invoice exists)
        if (invoice) {
            const totalPaidAgg = await paymentRecieved_1.default.aggregate([
                {
                    $match: {
                        branchId: new mongoose_1.Types.ObjectId(branchId),
                        invoiceId,
                        status: "Paid",
                        isDeleted: false,
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalPaid: { $sum: "$amount" },
                    },
                },
            ]);
            const totalPaid = totalPaidAgg[0]?.totalPaid || 0;
            invoice.status = totalPaid >= invoice.total ? "Paid" : "Partially Paid";
            await invoice.save();
        }
        return res.status(201).json({
            message: "Payment received successfully",
            paymentId,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.createPaymentReceived = createPaymentReceived;
const getAllPaymentReceived = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        //  Validate user
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        const userRole = user.role;
        const filterBranchId = req.query.branchId;
        const search = (req.query.search || "").trim();
        // Date filters (createdAt)
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;
        const statusFilter = req.query.status || "";
        // Pagination
        const limit = parseInt(req.query.limit) || 20;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        //  Determine allowed branches
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
        //  Apply branch filter if passed
        if (filterBranchId) {
            const filterId = new mongoose_2.default.Types.ObjectId(filterBranchId);
            if (!allowedBranchIds.some((id) => id.equals(filterId))) {
                return res.status(403).json({
                    message: "You are not authorized to view payments for this branch!",
                });
            }
            allowedBranchIds = [filterId];
        }
        //  Base match
        const matchStage = {
            branchId: { $in: allowedBranchIds },
            isDeleted: false,
            isReversed: false,
        };
        //  Date filter (createdAt)
        if (startDate && endDate) {
            matchStage.paymentRecieved = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }
        else if (startDate) {
            matchStage.paymentRecieved = { $gte: new Date(startDate) };
        }
        else if (endDate) {
            matchStage.paymentRecieved = { $lte: new Date(endDate) };
        }
        if (statusFilter) {
            matchStage.status = statusFilter;
        }
        //  Aggregation pipeline
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
            // Join Invoice (to get generated invoiceId)
            {
                $lookup: {
                    from: "invoices",
                    localField: "invoiceId",
                    foreignField: "invoiceId",
                    as: "invoice",
                },
            },
            { $unwind: { path: "$invoice", preserveNullAndEmptyArrays: true } },
            // Join Payment Mode (Account)
            {
                $unwind: {
                    path: "$paymentAccount",
                    preserveNullAndEmptyArrays: true,
                },
            },
        ];
        // 🔹 Search
        if (search.length > 0) {
            pipeline.push({
                $match: {
                    $or: [
                        { paymentId: { $regex: search, $options: "i" } },
                        { reference: { $regex: search, $options: "i" } },
                        { paymentMode: { $regex: search, $options: "i" } },
                        { "customer.name": { $regex: search, $options: "i" } },
                        { "invoice.invoiceId": { $regex: search, $options: "i" } },
                    ],
                },
            });
        }
        // 🔹 Count
        const countPipeline = [...pipeline, { $count: "total" }];
        const countResult = await paymentRecieved_1.default.aggregate(countPipeline);
        const totalCount = countResult[0]?.total || 0;
        //  Pagination + sorting
        pipeline.push({ $sort: { paymentRecieved: -1, createdAt: -1 } });
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: limit });
        //  Project required fields
        pipeline.push({
            $project: {
                _id: 1,
                paymentRecieved: 1,
                paymentId: 1,
                reference: 1,
                amount: 1,
                paymentMode: 1,
                status: 1,
                "customer.name": 1,
                "invoice.invoiceId": 1,
            },
        });
        //  Execute
        const payments = await paymentRecieved_1.default.aggregate(pipeline);
        return res.status(200).json({
            data: payments.map((p) => ({
                _id: p._id,
                paymentRecieved: p.paymentRecieved,
                createdAt: p.createdAt,
                paymentId: p.paymentId,
                reference: p.reference,
                customerName: p.customer?.name || null,
                invoiceId: p.invoice?.invoiceId || null,
                paymentMode: p.paymentMode || null,
                amount: p.amount,
                status: p.status,
            })),
            totalCount,
            page,
            limit,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getAllPaymentReceived = getAllPaymentReceived;
const updatePaymentReceived = async (req, res, next) => {
    try {
        const { paymentId } = req.params;
        const { branchId, customerId, invoiceId, paymentDate, accountId, amount, bankCharges = 0, paymentMode, reference, note, status, } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        // Find existing payment
        const existingPayment = await paymentRecieved_1.default.findOne({
            _id: paymentId,
            isDeleted: false,
            isReversed: false,
        });
        if (!existingPayment) {
            return res.status(404).json({ message: "Payment not found" });
        }
        // 2️ Reverse old payment
        existingPayment.isReversed = true;
        // existingPayment.reversedAt = new Date();
        // existingPayment.reversedById = new Types.ObjectId(userId);
        await existingPayment.save();
        // 3️ Reverse old transactions
        await transactions_1.default.updateMany({
            paymentId: existingPayment._id,
            isReversed: false,
        }, {
            $set: {
                isReversed: true,
                // reversedAt: new Date(),
                // reversedById: new Types.ObjectId(userId),
            },
        });
        const salesAccount = await accounts_1.default.findOne({
            branchId: new mongoose_1.Types.ObjectId(branchId),
            _id: accountId,
            isDeleted: false,
        });
        if (!salesAccount) {
            return res.status(400).json({ message: "Account not found!" });
        }
        // 4️ Create new Payment Received
        const newPayment = await paymentRecieved_1.default.create({
            branchId: existingPayment.branchId,
            customerId: new mongoose_1.Types.ObjectId(customerId),
            invoiceId: invoiceId || null,
            projectId: existingPayment.projectId || null,
            paymentId: existingPayment.paymentId, // SAME paymentId
            paymentDate,
            paymentRecieved: existingPayment.paymentRecieved,
            amount,
            bankCharges,
            accountId: accountId || null,
            paymentMode,
            reference,
            note,
            status,
            isReversed: false,
            createdById: new mongoose_1.Types.ObjectId(userId),
        });
        // 5️If Draft → stop here
        if (status === "Draft") {
            return res.status(200).json({
                message: "Payment updated as draft",
                paymentId: newPayment.paymentId,
            });
        }
        const transactionDate = newPayment.paymentRecieved ?? newPayment.paymentDate ?? new Date();
        // 7️ Credit Sales
        await (0, transactionHelper_1.createTransaction)({
            branchId: existingPayment.branchId,
            paymentId: existingPayment._id,
            paymentMode: paymentMode,
            accountId: salesAccount._id,
            transactionType: "Credit",
            amount: Number(amount),
            reference: existingPayment.paymentId,
            transactionDate,
            description: "Invoice payment received (Updated)",
            customerId: new mongoose_1.Types.ObjectId(customerId),
            createdById: new mongoose_1.Types.ObjectId(userId),
        });
        // 8️ Recalculate invoice status
        if (invoiceId) {
            const invoice = await invoice_1.default.findOne({
                branchId: existingPayment.branchId,
                invoiceId,
                isDeleted: false,
            });
            if (invoice) {
                const totalPaidAgg = await paymentRecieved_1.default.aggregate([
                    {
                        $match: {
                            branchId: existingPayment.branchId,
                            invoiceId,
                            status: "Paid",
                            isDeleted: false,
                            isReversed: false,
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            totalPaid: { $sum: "$amount" },
                        },
                    },
                ]);
                // const totalPaid = totalPaidAgg[0]?.totalPaid || 0;
                // const invoiceTotal = Number(invoice.total || 0);
                // invoice.status = totalPaid >= invoiceTotal ? "Paid" : "Partially Paid";
                await invoice.save();
            }
        }
        return res.status(200).json({
            message: "Payment updated successfully",
            paymentId: newPayment.paymentId,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.updatePaymentReceived = updatePaymentReceived;
const getOnePaymentReceived = async (req, res, next) => {
    try {
        const { paymentId } = req.params;
        const userId = req.user?.id;
        if (!mongoose_2.default.Types.ObjectId.isValid(paymentId)) {
            return res.status(400).json({ message: "Invalid paymentId" });
        }
        const user = await user_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        const pipeline = [
            {
                $match: {
                    _id: new mongoose_2.default.Types.ObjectId(paymentId),
                    isDeleted: false,
                    isReversed: false,
                },
            },
            // 🔹 Customer
            {
                $lookup: {
                    from: "customers",
                    localField: "customerId",
                    foreignField: "_id",
                    as: "customer",
                },
            },
            { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
            // 🔹 Invoice
            {
                $lookup: {
                    from: "invoices",
                    localField: "invoiceId",
                    foreignField: "_id",
                    as: "invoice",
                },
            },
            { $unwind: { path: "$invoice", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "branches",
                    localField: "branchId",
                    foreignField: "_id",
                    as: "branch",
                },
            },
            { $unwind: { path: "$branch", preserveNullAndEmptyArrays: true } },
            {
                $unwind: {
                    path: "$paymentAccount",
                    preserveNullAndEmptyArrays: true,
                },
            },
            // 🔹 Final Projection
            {
                $project: {
                    paymentRecieved: 1,
                    paymentDate: 1,
                    paymentId: 1,
                    branchId: 1,
                    accountId: 1,
                    note: 1,
                    reference: 1,
                    amount: 1,
                    bankCharges: 1,
                    status: 1,
                    createdAt: 1,
                    paymentMode: 1,
                    customer: {
                        _id: "$customer._id",
                        name: "$customer.name",
                    },
                    branch: {
                        branchId: "$branch.branchId",
                        branchName: "$branch.branchName",
                        email: "techone@gmail.com",
                        address: "$branch.address",
                        phone: "$branch.phone",
                        city: "$branch.city",
                    },
                    invoice: {
                        _id: "$invoice._id",
                        invoiceId: "$invoice.invoiceId",
                        invoiceDate: "$invoice.invoiceDate",
                        dueDate: "$invoice.dueDate",
                        projectId: "$invoice.projectId",
                        items: "$invoice.items",
                        subTotal: "$invoice.subTotal",
                        taxTotal: "$invoice.taxTotal",
                        total: "$invoice.total",
                        discount: "$invoice.discount",
                        status: "$invoice.status",
                    },
                },
            },
        ];
        const result = await paymentRecieved_1.default.aggregate(pipeline);
        if (!result.length) {
            return res.status(404).json({ message: "Payment not found" });
        }
        return res.status(200).json({
            data: result[0],
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getOnePaymentReceived = getOnePaymentReceived;
