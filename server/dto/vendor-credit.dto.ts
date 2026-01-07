import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { ItemDto } from "./item.dto";
import { commonStatus, PurchaseOrderDiscountType } from "../types/enum.types";

export class CreateVendorCreditDto {
  @IsNotEmpty()
  @IsMongoId()
  vendorId!: string;

  @IsString()
  @IsOptional()
  vendorCreditNoteNumber?: string;

  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @IsNotEmpty()
  date!: Date;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items!: ItemDto[];

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

  @IsOptional()
  @IsNumber()
  balanceAmount?: number;
}
