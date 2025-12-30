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
import { Transform, Type } from "class-transformer";
import { ItemDto } from "./item.dto";
import { PurchaseOrderDiscountType } from "../types/enum.types";

export class CreatePurchaseOrderDto {
  @IsString()
  @IsNotEmpty()
  purchaseOrderId!: string;

  @IsMongoId()
  vendorId!: string;

  @IsString()
  @IsOptional()
  quote?: string;

  @IsDateString()
  purchaseOrderDate!: string;

  @IsDateString()
  expDate!: string;

  @IsMongoId()
  salesPersonId!: string;

  @IsMongoId()
  @IsOptional()
  projectId?: string;

  @IsMongoId()
  branchId!: string;

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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items!: ItemDto[];

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
  @IsEnum([
    "Draft",
    "Sent",
    "Accepted",
    "Approved",
    "Invoiced",
    "Pending",
    "Declined",
  ])
  status?: string;

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

export class UpdatePurchaseOrderDto {
  @IsString()
  @IsOptional()
  purchaseOrderId?: string;

  @IsMongoId()
  @IsOptional()
  vendorId?: string;

  @IsString()
  @IsOptional()
  quote?: string;

  @IsDateString()
  @IsOptional()
  purchaseOrderDate?: string;

  @IsDateString()
  @IsOptional()
  expDate?: string;

  @IsMongoId()
  @IsOptional()
  salesPersonId?: string;

  @IsMongoId()
  @IsOptional()
  projectId?: string;

  @IsMongoId()
  @IsOptional()
  branchId?: string;

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
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value
  )
  items?: ItemDto[];

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
  @IsEnum([
    "Draft",
    "Sent",
    "Accepted",
    "Approved",
    "Invoiced",
    "Pending",
    "Declined",
  ])
  status?: string;

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
