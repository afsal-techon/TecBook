import {
  IsArray,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import {
  BillingPaymentStatus,
  commonStatus,
  PurchaseOrderDiscountType,
} from "../types/enum.types";
import { Transform, Type } from "class-transformer";
import { ItemDto } from "./item.dto";

export class CreateBillingRecordsDTO {
  @IsMongoId()
  @IsNotEmpty()
  vendorId!: string;

  @IsString()
  @IsNotEmpty()
  billNumber!: string;

  @IsMongoId()
  purchaseOrderNumber!: string;

  @IsDateString()
  billDate!: string;

  @IsDateString()
  dueDate!: string;

  @IsMongoId()
  @IsNotEmpty()
  branchId!: string;

  @IsMongoId()
  @IsNotEmpty()
  paymentTermsId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items!: ItemDto[];
  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  terms?: string;

  @IsEnum(PurchaseOrderDiscountType)
  @IsOptional()
  discountType?: PurchaseOrderDiscountType;

  @IsNumber()
  @IsOptional()
  discountValue?: number;

  @IsNumber()
  @IsOptional()
  vatValue?: number;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value
  )
  documents?: string[];
  @IsOptional()
  @IsArray()
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value
  )
  existingDocuments?: string[];

  @IsOptional()
  @IsString()
  @IsEnum(commonStatus)
  status?: commonStatus;

  @IsNumber()
  @IsOptional()
  subTotal?: number;

  @IsNumber()
  @IsOptional()
  taxTotal?: number;

  @IsNumber()
  @IsOptional()
  total?: number;
}

export class updateBillingRecordsDTO {
  @IsOptional()
  @IsMongoId()
  vendorId?: string;

  @IsOptional()
  @IsMongoId()
  purchaseOrderNumber?: string;

  @IsOptional()
  @IsDateString()
  billDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsMongoId()
  branchId?: string;

  @IsOptional()
  @IsMongoId()
  paymentTermsId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items?: ItemDto[];

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  terms?: string;

  @IsEnum(PurchaseOrderDiscountType)
  @IsOptional()
  discountType?: PurchaseOrderDiscountType;

  @IsNumber()
  @IsOptional()
  discountValue?: number;

  @IsNumber()
  @IsOptional()
  vatValue?: number;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value
  )
  documents?: string[];
  @IsOptional()
  @IsArray()
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value
  )
  existingDocuments?: string[];

  @IsOptional()
  @IsString()
  @IsEnum(commonStatus)
  status?: commonStatus;

  @IsNumber()
  @IsOptional()
  subTotal?: number;

  @IsNumber()
  @IsOptional()
  taxTotal?: number;

  @IsNumber()
  @IsOptional()
  total?: number;
}
