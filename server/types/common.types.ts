import { Types, Document } from "mongoose";

export interface IBranch extends Document {
  companyAdminId?: Types.ObjectId | null;
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
  branchIds?: Types.ObjectId[]; // ✅ store multiple branches
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
  branchIds?: Types.ObjectId[];
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
  branchIds?: Types.ObjectId[];
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
  parentAccountId?:
    | Types.ObjectId
    | {
        _id: Types.ObjectId;
        accountName: string;
      }
    | null;
  createdById?: Types.ObjectId | null;
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
  email?: string;
  openingBalance?: number;
  paymentTerms?: string;
  currency?: string;
  note?: string;
  billingInfo?: {
    country?: string | null;
    billingAddress?: string | null;
    city?: Types.ObjectId | null;
    zipCode?: Date | null;
  };
  shippingInfo?: {
    country?: string | null;
    shippingAddress?: string | null;
    city?: Types.ObjectId | null;
    zipCode?: Date | null;
  };
  taxTreatment?: string | null;
  trn?: string | null;
  placeOfSupplay?: string | null;
  documents?: {
    doc_name: string | null;
    doc_file: string | null;
    doc_typeId: Types.ObjectId | null;
    startDate: Date | null;
    endDate: Date | null;
  }[];
  isDeleted?: boolean;
  createdById?: Types.ObjectId | null;
  deletedAt?: Date | null;
  deletedById?: Types.ObjectId | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICategory extends Document {
  branchId?: Types.ObjectId | null;
  name?: string;
  isDeleted?: boolean;
  createdById?: Types.ObjectId | null;
  deletedAt?: Date | null;
  deletedById?: Types.ObjectId | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICategory extends Document {
  branchIds?: Types.ObjectId[];
  name?: string;
  isDeleted?: boolean;
  createdById?: Types.ObjectId | null;
  deletedAt?: Date | null;
  deletedById?: Types.ObjectId | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUnit extends Document {
  branchIds?: Types.ObjectId[];
  unit?: string;
  isDeleted?: boolean;
  createdById?: Types.ObjectId | null;
  deletedAt?: Date | null;
  deletedById?: Types.ObjectId | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface InventoryTracking {
  isTrackable: boolean;
  inventoryAccountId?: Types.ObjectId | null;
  openingStock?: number | null;
  openingStockRatePerUnit?: number | null;
  reOrderPoint?: number | null;
}

export interface IItem extends Document {
  branchId?: Types.ObjectId | null;
  categoryId?: Types.ObjectId | null;
  name: string;
  type: string;
  salesInfo?: {
    sellingPrice?: string | null;
    accountId?: Types.ObjectId | null;
    description?: Types.ObjectId | null;
    saleUnitId: Types.ObjectId | null;
    taxId?: Types.ObjectId | null;
  };
  purchaseInfo?: {
    costPrice?: string | null;
    accountId?: Types.ObjectId | null;
    description?: Types.ObjectId | null;
    purchaseUnitId: Types.ObjectId | null;
    taxId?: Types.ObjectId | null;
  };
  inventoryTracking?: InventoryTracking;
  taxTreatment: string | null;
  sellable: boolean;
  conversionRate: number | null;
  purchasable: boolean;
  totalOpeningValue?: number | null;
  totalStockInBaseUnit?: number | null;
  isDeleted?: boolean;
  createdById?: Types.ObjectId | null;
  deletedAt?: Date | null;
  deletedById?: Types.ObjectId | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IQuotes extends Document {
  branchId?: Types.ObjectId | null;
  customerId?: Types.ObjectId | null;
  projectId?: string;
  quoteId: string;
  quoteDate: Date | null;
  expDate: Date | null;
  salesPersonId: Types.ObjectId | null;
  terms: string;
  note: string;
  reference: string;
  documents?: string[];
  items?: {
    itemId: Types.ObjectId | null;
    itemName: string | null;
    qty: number | null;
    tax: number | null;
    rate: Types.ObjectId | null;
    unit: string;
    amount: number | null;
    discount: number | null;
  }[];
  status: string | null;
  subTotal: number | null;
  total: number | null;
  taxTotal: number | null;
  discount: number | null;
  isDeleted?: boolean;
  createdById?: Types.ObjectId | null;
  deletedAt?: Date | null;
  deletedById?: Types.ObjectId | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IVendor extends Document {
  branchId?: Types.ObjectId | null;
  name?: string;
  phone?: number;
  openingBalance?: number;
  note?: string;
  billingInfo?: {
    country?: string | null;
    billingAddress?: string | null;
    city?: Types.ObjectId | null;
    zipCode?: Date | null;
  };
  shippingInfo?: {
    country?: string | null;
    shippingAddress?: string | null;
    city?: Types.ObjectId | null;
    zipCode?: Date | null;
  };
  taxTreatment?: string | null;
  trn?: string | null;
  placeOfSupplay?: string | null;
  isDeleted?: boolean;
  createdById?: Types.ObjectId | null;
  deletedAt?: Date | null;
  deletedById?: Types.ObjectId | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITax extends Document {
  branchId?: Types.ObjectId | null;
  name: string; // e.g., "GST 5%" or "VAT 10%"
  type: "GST" | "VAT";
  cgstRate?: number | null; // for GST
  sgstRate?: number | null; // for GST
  vatRate?: number | null; // for VAT
  description?: string | null;
  isActive?: boolean;
  isDeleted?: boolean;
  createdById?: Types.ObjectId | null;
  deletedAt?: Date | null;
  deletedById?: Types.ObjectId | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface INumberSetting extends Document {
  branchId: Types.ObjectId | null;
  docType: "QUOTE" | "SALE_ORDER" | "INVOICE";
  prefix: string; // e.g. "QT-"
  nextNumber: number; // e.g. 8  (for 000008)
  nextNumberRaw: string; // e.g. 6  (number of digits)
  mode: "Auto" | "Manual";
}

export interface ISaleOrder extends Document {
  branchId?: Types.ObjectId | null;
  customerId?: Types.ObjectId | null;
  saleOrderId?: string;
  saleOrderDate?: Date | null;
  deliveryDate?: Date | null;
  salesPersonId?: Types.ObjectId | null;
  paymentTerms?: {
    termName?: string | null;
    days?: number | 0;
  };
  terms?: string | null;
  note: string | null;
  documents?: string[];
  items?: {
    itemId: Types.ObjectId | null;
    qty: number | null;
    tax: number | null;
    rate: Types.ObjectId | null;
    unit: string;
    amount: number | null;
    discount: number | null;
  }[];
  reference: string;
  status: string | null;
  subTotal: number | null;
  total: number | null;
  taxTotal: number | null;
  discount: number | null;
  isDeleted?: boolean;
  createdById?: Types.ObjectId | null;
  deletedAt?: Date | null;
  deletedById?: Types.ObjectId | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPaymentTerms extends Document {
  branchId?: Types.ObjectId;
  terms?: {
    termName?: string;
    days?: number;
    status?: boolean;
  }[];
  isDeleted?: boolean;
  createdById?: Types.ObjectId | null;
  deletedAt?: Date | null;
  deletedById?: Types.ObjectId | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IProject extends Document {
  branchId?: Types.ObjectId | null;
  customerId?: Types.ObjectId | null;
  projectName?: string;
  projectId?: string;
  billingMethod?: string;
  description?: string;
  users?: {
    userId: Types.ObjectId | null;
    email: string;
    ratePerHour:number;
  }[];
  ratePerHour:number;
  projectCost:number;
  status:string;

  tasks?: {
    taskName: string;
    description: string;
    ratePerHour: number;
    billable: boolean;
  }[];
  costBudget: number | 0;
  revenueBudget: number | 0
  isDeleted?: boolean;
  createdById?: Types.ObjectId | null;
  deletedAt?: Date | null;
  deletedById?: Types.ObjectId | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}


export interface ISalesPerson extends Document {
  branchId?: Types.ObjectId | null;
  name?: string;
   email?: string;
  isDeleted?: boolean;
  createdById?: Types.ObjectId | null;
  deletedAt?: Date | null;
  deletedById?: Types.ObjectId | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}



export interface IInvoice extends Document {
  branchId?: Types.ObjectId | null;
  customerId?: Types.ObjectId | null;
  invoiceId?: string;
  orderNumber?: string;
  invoiceDate?: Date | null;
  dueDate?:Date | null;
  salesPersonId?: Types.ObjectId | null;
  projectId?: Types.ObjectId | null;
  paymentTerms?: {
    termName?: string | null;
    days?: number | 0;
  };
  subject:string  | null;
  terms?: string | null;
  note: string | null;
  documents?: string[];
  items?: {
    itemId: Types.ObjectId | null;
    qty: number | null;
    tax: number | null;
    rate: Types.ObjectId | null;
    unit: string;
    amount: number | null;
    discount: number | null;
  }[];
  status: string | null;
  subTotal: number | null;
  total: number | null;
  taxTotal: number | null;
  discount: number | null;
  isDeleted?: boolean;
  createdById?: Types.ObjectId | null;
  deletedAt?: Date | null;
  deletedById?: Types.ObjectId | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}


export interface ILogEntry extends Document {
  branchId?: Types.ObjectId | null;
  date:Date;
  projectId?: string;
  taskId:Types.ObjectId | null;
 startTime:Date | null;
 endTime : Date | null;
 timeSpent: string | null;
  billable:boolean,
  userId:Types.ObjectId | null;
  note:string,
  createdById?: Types.ObjectId | null;
   isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedById?: Types.ObjectId | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}



export interface IPayment extends Document {
  branchId?: Types.ObjectId | null;
  customerId?: Types.ObjectId | null;
  paymentId?: string;
  invoiceId?: Types.ObjectId | null;
  amount?: number;
  paymentDate?: Date | null;
  projectId?: Types.ObjectId | null;
  paymentMode: Types.ObjectId | null;
  paymentRecieved?: Date | null;
  status: string | null;
  accountId?: Types.ObjectId | null;
  reference?: string | null;
  bankCharges: number  | null;
  isReversed?: boolean;
  note: string | null;
  documents?: string[];
  isDeleted?: boolean;
  createdById?: Types.ObjectId | null;
  deletedAt?: Date | null;
  deletedById?: Types.ObjectId | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITransactions extends Document {
  branchId: Types.ObjectId;
  accountId: Types.ObjectId;
  transactionType: "Debit" | "Credit";
  paymentId?: Types.ObjectId | null;
  amount: number;
  reference?: string;
  description?: string;
  purchaseId?: Types.ObjectId | null;
  customerId?: Types.ObjectId;
  transactionDate?: Date | null;
  vendorId?: Types.ObjectId | null;
   invoiceId?: Types.ObjectId | null;
   isReversed?: boolean;
   isDeleted?: boolean;
  createdById?: Types.ObjectId | null;
  deletedAt?: Date | null;
  deletedById?: Types.ObjectId | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}


export interface IPaymentModes extends Document {
  branchId?: Types.ObjectId;
  paymentMode: string[];
  isDeleted?: boolean;
  createdById?: Types.ObjectId | null;
  deletedAt?: Date | null;
  deletedById?: Types.ObjectId | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

