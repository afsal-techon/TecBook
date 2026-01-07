import { Types } from "mongoose";
import { IBaseFIelds } from "./base.interface";
import { IItem } from "./item.interface";
import { commonStatus } from "../types/enum.types";

export interface IVendorCredit extends IBaseFIelds {
  vendorId: Types.ObjectId;
  vendorCreditNoteNumber: string;
  referenceNumber?: string;
  date: Date;
  subject?: string;
  items: IItem[];
  branchId: Types.ObjectId;
  note?: string;
  terms?: string;
  discountType: string;
  discountValue: number;
  vatValue: number;
  status: commonStatus;
  documents: string[];
  subTotal: number;
  taxTotal: number;
  total: number;
  balanceAmount: number;
}
