import {
  IsArray,
  IsBoolean,
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
  commonStatus,
  PurchaseOrderDiscountType,
  TaxPreferences,
} from "../types/enum.types";
import { Transform, Type } from "class-transformer";
import { ItemDto } from "./item.dto";

export class CreateExpenseDto {
  @IsDateString()
  @IsNotEmpty()
  date!: string;

  @IsString()
  @IsNotEmpty()
  expenseNumber!: string;

  @IsMongoId()
  @IsNotEmpty()
  customerId!: string;

  @IsMongoId()
  @IsNotEmpty()
  branchId!: string;

  @IsEnum(TaxPreferences)
  @IsString()
  @IsOptional()
  taxPreference?: TaxPreferences;

  @IsMongoId()
  @IsNotEmpty()
  paidAccount!: string;

  @IsMongoId()
  @IsNotEmpty()
  vendorId!: string;

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

  @Transform(({value}) => value === "" || value === "undefined" || value === null ? undefined : value)
  @IsOptional()
  @IsMongoId()
  projectId?:string

  @IsOptional()
  @IsBoolean()
  isBillable?:boolean
}

export class UpdateExpenseDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  expenseNumber?: string;

  @IsOptional()
  @IsMongoId()
  customerId?: string;

  @IsOptional()
  @IsMongoId()
  branchId?: string;

  @IsEnum(TaxPreferences)
  @IsString()
  @IsOptional()
  taxPreference?: TaxPreferences;

  @IsOptional()
  @IsMongoId()
  paidAccount?: string;

  @IsOptional()
  @IsMongoId()
  vendorId?: string;

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

  @Transform(({value}) => value === "" || value === "undefined" || value === null ? undefined : value)
  @IsOptional()
  @IsMongoId()
  projectId?:string

  @IsOptional()
  @IsBoolean()
  isBillable?:boolean
}
