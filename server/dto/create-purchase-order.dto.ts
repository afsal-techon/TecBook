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
  @IsNumber()
  @IsNotEmpty()
  purchaseOrderId!: string;

  @IsMongoId()
  vendorId!: string;

  @IsString()
  @IsNotEmpty()
  quote!: string;

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
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value
  )
  items!: ItemDto[];
}

export class UpdatePurchaseOrderDto {
  @IsNumber()
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
}
