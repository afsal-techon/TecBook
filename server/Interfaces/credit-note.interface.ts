import { Types } from "mongoose";
import { IBaseFIelds } from "./base.interface";
import { commonStatus, CreditNoteStatus, PurchaseOrderDiscountType } from "../types/enum.types";
import { IItem } from "./item.interface";

export interface ICreditNote extends IBaseFIelds {
  branchId: Types.ObjectId;
  customerId: Types.ObjectId;
  date: Date;
  salesPersonId: Types.ObjectId;
  creditNoteNumber?: string;
  subject?: string;
  note?: string | null;
  terms?: string | null;
  discountType: PurchaseOrderDiscountType;
  discountValue: number;
  vatValue: number;
  status?: CreditNoteStatus;
  documents: string[];
  subTotal: number;
  taxTotal: number;
  total: number;
  items: IItem[];
  balanceAmount?:number;
  receivedAmount?:number;
}
