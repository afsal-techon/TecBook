import { Types, Document } from "mongoose";

export interface IBranch extends Document {
  comapnyAdminId?: Types.ObjectId | null;
  branchName?: string;
  country?: string;
  trn?: string;
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
  branchName: string;
  trn: string;
  state: string;
  country: string;
  city: string;
  address: string;
  phone: string;
  landline: string;
  logo: string;
  // vatPercentage:string,
  currency: string;
  currencySymbol: string;
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
  phone?: number;
  createdById?: Types.ObjectId | null;
  deletedAt?: Date | null;
  deletedById?: Types.ObjectId | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IEmployee extends Document {
  branchId?: Types.ObjectId | null;
  positionId?: Types.ObjectId | null;
  departmentId?: Types.ObjectId | null;
  documentId?: Types.ObjectId | null;
  empId?: string;
  salary?: number;
  dateOfJoining: string;
  firstName?: string;
  lastName?: string;
  contactNo2?: string;
  nationality?: string;
  motherName?: string;
  fieldOfStudy?: string;
  residentialAddress?: string;
  dateOfBirth?: string;
  gender?: string;
  contactNo?: Types.ObjectId | null;
  email?: string;
  fatherName?: string;
  qualification?: string;
  maritalStatus?: string;

  documents?: {
    doc_name: string | null;
    doc_file: string | null;
    doc_typeId: Types.ObjectId | null;
    startDate: Date | null;
    endDate: Date | null;
  }[];
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedById?: Types.ObjectId | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IActionPermissions {
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
}

export interface IModulePermission {
  module: string;
  moduleFullAccess: boolean;
  actions: IActionPermissions;
}

export interface IPermission extends Document {
  name: string; // role name
  branchId?: Types.ObjectId | null;
  permissions: IModulePermission[];

  fullAdminAccess?: boolean;

  User: Types.ObjectId | null;
  createdBy?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedById?: Types.ObjectId | null;
  deletedBy?: string | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface IDocumentType extends Document {
  branchId?: Types.ObjectId | null;
  doc_type?: string;
  isDeleted?: boolean;
  createdById?: Types.ObjectId | null;
  deletedAt?: Date | null;
  deletedById?: Types.ObjectId | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAccounts extends Document {
  branchId?: Types.ObjectId | null;
  accountName?: string;
  accountType?: string;
  description?: string;
  openingBalance?: string;
  isDeleted?: boolean;
  parentAccountId?: Types.ObjectId | null;
  createdById?: Types.ObjectId | null;
  deletedAt?: Date | null;
  deletedById?: Types.ObjectId | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITransactions extends Document {
  branchId?: Types.ObjectId | null;
  accountId?: Types.ObjectId | null;
  purchaseId?: Types.ObjectId | null;
  expenseId?: Types.ObjectId | null;
  customerId?: Types.ObjectId | null;
  supplierId?: Types.ObjectId | null;
  amount: number;
  type:string;
  referenceId : string;
  referenceType:string;
  description:string;
  totalBeforeVAT:number;
  vatAmount:number;
  paymentType:Types.ObjectId | null;
  isDeleted?: boolean;
  parentAccountId?: Types.ObjectId | null;
  createdById?: Types.ObjectId | null;
  deletedAt?: Date | null;
  deletedById?: Types.ObjectId | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}
