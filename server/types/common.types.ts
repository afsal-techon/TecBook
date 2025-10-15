import { Types, Document } from "mongoose";

export interface IBranch extends Document {
  comapnyAdminId?: Types.ObjectId | null;
  branchName?: string;
  branchCode?: string;
  country?: string;
  city?: string;
  contact1?: string;
  contact2: string;
  state?: string;
  address?: string;
  email?: string;
  logo?: string;
  vatPercentage?: number;
  currency?: string;
  currencySymbol?: string;
  status?: boolean;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedById?: Types.ObjectId | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface createBranchBody {
  branchName: string,
  branchCode: string,
  state: string,
  country:string,
  city: string,
  address: string,
  contact1: string,
  contact2: string,
  email: string,
  logo: string,
  vatPercentage:string,
  currency:string,
   currencySymbol:string,
}


export interface IDepartment extends Document {
  branchId?: Types.ObjectId | null;
  dept_name?: string;
  isDeleted?: boolean;
  createdById?: Types.ObjectId | null;
  deletedAt?: Date | null;
  deletedById?: Types.ObjectId | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPosition extends Document {
  branchId?: Types.ObjectId | null;
  departmentId?: Types.ObjectId | null;
  pos_name?: string;
  createdById?: Types.ObjectId | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedById?: Types.ObjectId | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}