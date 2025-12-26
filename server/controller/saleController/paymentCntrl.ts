import USER from "../../models/user";
import INVOICE from "../../models/invoice";
import PAYMENT_RECEIVED from "../../models/paymentRecieved";
import express, { Request, Response, NextFunction } from "express";
import CUSTOMER from "../../models/customer";
import { imagekit } from "../../config/imageKit";
import { Types } from "mongoose";
import BRANCH from "../../models/branch";
import mongoose from "mongoose";
import QuoteNumberSetting from "../../models/numberSetting";
import ACCOUNT from "../../models/accounts";
import { createTransaction } from "../../Helper/transactionHelper";
import TRANSACTION from "../../models/transactions";

export const createPaymentReceived = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const {
      branchId,
      customerId,
      invoiceId,
      paymentId,
      paymentDate,
      amount,
      accountId,
      bankCharges = 0,
      paymentMode,
      reference,
      status,
    } = req.body;

    const userId = req.user?.id;
    let invoice: any = null;

    // 1️ Basic validations
    if (!userId) {
      return res.status(401).json({ message: "User not found!" });
    }

    if (!branchId || !Types.ObjectId.isValid(branchId)) {
      return res.status(400).json({ message: "Invalid Branch Id!" });
    }

    if (!customerId || !Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ message: "Invalid Customer Id!" });
    }

    if (!paymentId || typeof paymentId !== "string") {
      return res.status(400).json({ message: "Payment Id is required!" });
    }

    if (!paymentDate || typeof paymentDate !== "string") {
      return res.status(400).json({ message: "Payment Date is required!" });
    }

    if(accountId && !Types.ObjectId.isValid(accountId)){
      return res.status(400).json({ message: "Invalid Account Id!" });
    }

    if (!paymentMode || !Types.ObjectId.isValid(paymentMode)) {
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

    // 2️ Find invoice (optional but validated)
    if (invoiceId) {
      invoice = await INVOICE.findOne({
        branchId: new Types.ObjectId(branchId),
        invoiceId,
        isDeleted: false,
      });

      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found!" });
      }
    }

    // 3️ Validate payment account (Bank / Cash)
    const paymentAccount = await ACCOUNT.findOne({
      branchId: new Types.ObjectId(branchId),
      _id: paymentMode,
      isDeleted: false,
    });

    if (!paymentAccount) {
      return res.status(400).json({ message: "Payment account not found!" });
    }

    // 4️ Get Sales account
    const salesAccount = await ACCOUNT.findOne({
      branchId: new Types.ObjectId(branchId),
       _id: accountId,
      isDeleted: false,
    });

    if (!salesAccount) {
      return res.status(400).json({ message: "Account not found!" });
    }

    //  Upload attached documents if any
    const uploadedFiles: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const uploadResponse = await imagekit.upload({
          file: file.buffer.toString("base64"),
          fileName: file.originalname,
          folder: "/images",
        });
        uploadedFiles.push(uploadResponse.url);
      }
    }

    // 5️ Create Payment Received
   const payment = await PAYMENT_RECEIVED.create({
      branchId: new Types.ObjectId(branchId),
      customerId: new Types.ObjectId(customerId),
      invoiceId: invoiceId || null,
      projectId: invoice?.projectId || null,
      paymentId,
      paymentDate,
      paymentRecieved: new Date(),
      amount,
      bankCharges,
      accountId: salesAccount._id,
      paymentMode,
      reference,
      documents: uploadedFiles,
      status,
      createdById: new Types.ObjectId(userId),
    });

    // 6️ If Draft → stop here
    if (status === "Draft") {
      return res.status(201).json({
        message: "Payment saved as draft",
        paymentId,
      });
    }

    // 7️ Bank / Cash → Debit
    await createTransaction({
      branchId: new Types.ObjectId(branchId),
      paymentId: payment._id as Types.ObjectId,
      accountId: new Types.ObjectId(paymentMode),
      transactionType: "Debit",
      amount: Number(amount),
      reference: paymentId,
      transactionDate: new Date(),
      description: "Payment received",
      customerId: new Types.ObjectId(customerId),
      createdById: new Types.ObjectId(userId),
    });

    // 8️ Sales → Credit
    await createTransaction({
      branchId: new Types.ObjectId(branchId),
       paymentId: payment._id as Types.ObjectId,
      accountId: salesAccount._id as Types.ObjectId,
      transactionType: "Credit",
      amount: Number(amount),
      reference: paymentId,
      transactionDate: new Date(),
      description: "Invoice payment received",
      customerId: new Types.ObjectId(customerId),
      createdById: new Types.ObjectId(userId),
    });

    // 9️ Update invoice status (only if invoice exists)
    if (invoice) {
      const totalPaidAgg = await PAYMENT_RECEIVED.aggregate([
        {
          $match: {
            branchId: new Types.ObjectId(branchId),
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
  } catch (err) {
    next(err);
  }
};

export const getAllPaymentReceived = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const userId = req.user?.id;

    //  Validate user
    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    const userRole = user.role;
    const filterBranchId = req.query.branchId as string;
    const search = ((req.query.search as string) || "").trim();

    // Date filters (createdAt)
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const statusFilter = (req.query.status as string) || "";

    // Pagination
    const limit = parseInt(req.query.limit as string) || 20;
    const page = parseInt(req.query.page as string) || 1;
    const skip = (page - 1) * limit;

    //  Determine allowed branches
    let allowedBranchIds: mongoose.Types.ObjectId[] = [];

    if (userRole === "CompanyAdmin") {
      const branches = await BRANCH.find({
        companyAdminId: userId,
        isDeleted: false,
      }).select("_id");

      allowedBranchIds = branches.map(
        (b) => new mongoose.Types.ObjectId(b._id as mongoose.Types.ObjectId)
      );
    } else if (userRole === "User") {
      if (!user.branchId) {
        return res
          .status(400)
          .json({ message: "User is not assigned to any branch!" });
      }
      allowedBranchIds = [user.branchId];
    } else {
      return res.status(403).json({ message: "Unauthorized role!" });
    }

    //  Apply branch filter if passed
    if (filterBranchId) {
      const filterId = new mongoose.Types.ObjectId(filterBranchId);
      if (!allowedBranchIds.some((id) => id.equals(filterId))) {
        return res.status(403).json({
          message: "You are not authorized to view payments for this branch!",
        });
      }
      allowedBranchIds = [filterId];
    }

    //  Base match
    const matchStage: any = {
      branchId: { $in: allowedBranchIds },
      isDeleted: false,
      isReversed: false,
    };

    //  Date filter (createdAt)
    if (startDate && endDate) {
      matchStage.paymentRecieved  = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      matchStage.paymentRecieved  = { $gte: new Date(startDate) };
    } else if (endDate) {
      matchStage.paymentRecieved  = { $lte: new Date(endDate) };
    }

    if (statusFilter) {
      matchStage.status = statusFilter;
    }

    //  Aggregation pipeline
    const pipeline: any[] = [
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
        $lookup: {
          from: "accounts",
          localField: "paymentMode",
          foreignField: "_id",
          as: "paymentAccount",
        },
      },
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
            { "customer.name": { $regex: search, $options: "i" } },
            { "invoice.invoiceId": { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    // 🔹 Count
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await PAYMENT_RECEIVED.aggregate(countPipeline);
    const totalCount = countResult[0]?.total || 0;

    //  Pagination + sorting
   pipeline.push({ $sort: { paymentRecieved: -1, createdAt: -1 } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    //  Project required fields
    pipeline.push({
      $project: {
        paymentRecieved: 1,
        paymentId: 1,
        reference: 1,
        amount: 1,
        status: 1,
        "customer.name": 1,
        "invoice.invoiceId": 1,
        paymentModeName: "$paymentAccount.accountName",
      },
    });

    //  Execute
    const payments = await PAYMENT_RECEIVED.aggregate(pipeline);

    return res.status(200).json({
      data: payments.map((p) => ({
        paymentRecieved: p.paymentRecieved,
        createdAt: p.createdAt,
        paymentId: p.paymentId,
        reference: p.reference,
        customerName: p.customer?.name || null,
        invoiceId: p.invoice?.invoiceId || null,
        paymentMode: p.paymentModeName || null,
        amount: p.amount,
        status: p.status,
      })),
      totalCount,
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
};

export const updatePaymentReceived = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { paymentId } = req.params;
    const {
      branchId,
      customerId,
      invoiceId,
      paymentDate,
      accountId,
      amount,
      bankCharges = 0,
      paymentMode,
      reference,
      status,
    } = req.body;

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Find existing payment
    const existingPayment = await PAYMENT_RECEIVED.findOne({
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
    await TRANSACTION.updateMany(
      {
         paymentId: existingPayment._id,
        isReversed: false,
      },
      {
        $set: {
          isReversed: true,
          // reversedAt: new Date(),
          // reversedById: new Types.ObjectId(userId),
        },
      }
    );

    // 4️ Create new Payment Received
    const newPayment = await PAYMENT_RECEIVED.create({
      branchId: existingPayment.branchId,
      customerId: new Types.ObjectId(customerId),
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
      status,
      isReversed: false,
      createdById: new Types.ObjectId(userId),
    });

    // 5️If Draft → stop here
    if (status === "Draft") {
      return res.status(200).json({
        message: "Payment updated as draft",
        paymentId: newPayment.paymentId,
      });
    }

    const transactionDate =
    newPayment.paymentRecieved ?? newPayment.paymentDate ?? new Date();

    // 6️ Debit Bank / Cash
    await createTransaction({
      branchId: existingPayment.branchId as Types.ObjectId,
      paymentId: existingPayment._id as Types.ObjectId,
      accountId: new Types.ObjectId(paymentMode),
      transactionType: "Debit",
      amount: Number(amount) - Number(bankCharges),
      reference: existingPayment.paymentId,
      transactionDate,
      description: "Payment received (Updated)",
      customerId: new Types.ObjectId(customerId),
      createdById: new Types.ObjectId(userId),
    });

    // 7️ Credit Sales
    await createTransaction({
      branchId: existingPayment.branchId as Types.ObjectId,
       paymentId: existingPayment._id as Types.ObjectId,
      accountId: accountId as Types.ObjectId,
      transactionType: "Credit",
      amount: Number(amount),
      reference: existingPayment.paymentId,
       transactionDate,
      description: "Invoice payment received (Updated)",
      customerId: new Types.ObjectId(customerId),
      createdById: new Types.ObjectId(userId),
    });

    // 8️ Recalculate invoice status
    if (invoiceId) {
      const invoice = await INVOICE.findOne({
        branchId: existingPayment.branchId,
        invoiceId,
        isDeleted: false,
      });

      if (invoice) {
        const totalPaidAgg = await PAYMENT_RECEIVED.aggregate([
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

        const totalPaid = totalPaidAgg[0]?.totalPaid || 0;
        const invoiceTotal = Number(invoice.total || 0);

        invoice.status = totalPaid >= invoiceTotal ? "Paid" : "Partially Paid";

        await invoice.save();
      }
    }

    return res.status(200).json({
      message: "Payment updated successfully",
      paymentId: newPayment.paymentId,
    });
  } catch (err) {
    next(err);
  }
};


export const getOnePaymentReceived = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { paymentId } = req.params;
     const userId = req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({ message: "Invalid paymentId" });
    }

     const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    const pipeline: any[] = [
      {
        $match: {
          _id: new mongoose.Types.ObjectId(paymentId),
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
          foreignField: "invoiceId",
          as: "invoice",
        },
      },
      { $unwind: { path: "$invoice", preserveNullAndEmptyArrays: true } },

      // 🔹 Payment Mode (Account)
      {
        $lookup: {
          from: "accounts",
          localField: "paymentMode",
          foreignField: "_id",
          as: "paymentAccount",
        },
      },
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
          reference: 1,
          amount: 1,
          bankCharges: 1,
          status: 1,
          createdAt: 1,

          customer: {
            _id: "$customer._id",
            name: "$customer.name",
          },

          paymentMode: {
            _id: "$paymentAccount._id",
            name: "$paymentAccount.accountName",
          },

          invoice: {
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

    const result = await PAYMENT_RECEIVED.aggregate(pipeline);

    if (!result.length) {
      return res.status(404).json({ message: "Payment not found" });
    }

    return res.status(200).json({
      data: result[0],
    });
  } catch (err) {
    next(err);
  }
};
