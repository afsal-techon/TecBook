import { Types, Document } from "mongoose";

export interface IBranch extends Document {
  comapnyAdminId?: Types.ObjectId | null;
  branchName?: string;
  country?: string;
  trn?:string;
  city?: string;
  phone?: string;
  landline: string;
  state?: string;
  address?: string;
  logo?: string;
  // vatPercentage?: number;
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
  trn: string,
  state: string,
  country:string,
  city: string,
  address: string,
  phone: string,
  landline: string,
  logo: string,
  // vatPercentage:string,
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

export interface ICustomer extends Document {
  branchId?: Types.ObjectId | null;
  name?: string;
  phone?: number ;
  createdById?: Types.ObjectId | null;
  deletedAt?: Date | null;
  deletedById?: Types.ObjectId | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}


export interface IEmployee extends Document {
  branchId?: Types.ObjectId | null;
  positionId?:Types.ObjectId | null;
  departmentId?:Types.ObjectId | null;
  empId?:string;
  salary?:number;
  dateOfJoining:string;
  firstName?: string;
  lastName?:string;
  contactNo2?:string;
  nationality?:string;
  motherName?:string;
  fieldOfStudy?:string;
  residentialAddress?:string;
  dateOfBirth?:string;
  gender?: string ;
  contactNo?: Types.ObjectId | null;
  email?:string;
  fatherName?:string;
  qualification?:string;
  maritalStatus?:string;

  documents?:{
    doc_name:string | null ;
    doc_file:string |null
    doc_type:string |null
  }[];
 isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedById?: Types.ObjectId | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}