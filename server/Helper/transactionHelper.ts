import { Types } from "mongoose";
import TRANSACTION from "../models/transactions";



interface CreateTransactionParams {
  branchId: Types.ObjectId;
  accountId: Types.ObjectId;
  transactionType: "Debit" | "Credit";
  amount: number;
  paymentId?: Types.ObjectId;
  transactionDate?: Date;
  reference?: string;
  description?: string;
  customerId?: Types.ObjectId;
  vendorId?: Types.ObjectId;
  createdById: Types.ObjectId;
}


export const createTransaction = async ({
  branchId,
  accountId,
  transactionType,
  amount,
  paymentId,
  reference,
  description,
  customerId,
  transactionDate,
  vendorId,
  createdById,
}: CreateTransactionParams): Promise<void> => {
  if (amount <= 0) return;

  await TRANSACTION.create({
    branchId,
    accountId,
    transactionType,
    amount,
    paymentId,
    reference,
    transactionDate,
    description,
    customerId: customerId || null,
    vendorId: vendorId || null,
    createdById,
  });
};
