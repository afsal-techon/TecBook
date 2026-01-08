import {
  IsArray,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  Min,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import {
  CreditNoteStatus,
  PurchaseOrderDiscountType,
} from "../types/enum.types";
import { ItemDto } from "./item.dto";

export class CreateCreditNoteDto {
  @IsMongoId()
  branchId!: string;

  @IsMongoId()
  customerId!: string;

  @IsDateString()
  date!: string;

  @IsMongoId()
  @IsOptional()
  salesPersonId?: string;

  @IsOptional()
  @IsString()
  creditNoteNumber?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  note?: string | null;

  @IsOptional()
  @IsString()
  terms?: string | null;

  @IsEnum(PurchaseOrderDiscountType)
  @IsOptional()
  @IsString()
  discountType?: PurchaseOrderDiscountType;

  @IsNumber()
  @Min(0)
  discountValue?: number;

  @IsNumber()
  @Min(0)
  vatValue?: number;

  @IsOptional()
  @IsEnum(CreditNoteStatus)
  status?: CreditNoteStatus;

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

  @IsNumber()
  @Min(0)
  subTotal?: number;

  @IsNumber()
  @Min(0)
  taxTotal?: number;

  @IsNumber()
  @Min(0)
  total?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items!: ItemDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  balanceAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  receivedAmount?: number;
}

export class UpdateCreditNoteDto {
  @IsOptional()
  @IsMongoId()
  branchId?: string;

  @IsOptional()
  @IsMongoId()
  customerId?: string;

  @IsOptional()
  @IsDateString()
  date?: Date;

  @IsOptional()
  @IsMongoId()
  salesPersonId?: string;

  @IsOptional()
  @IsString()
  creditNoteNumber?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  note?: string | null;

  @IsOptional()
  @IsString()
  terms?: string | null;

  @IsOptional()
  @IsEnum(PurchaseOrderDiscountType)
  discountType?: PurchaseOrderDiscountType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  vatValue?: number;

  @IsOptional()
  @IsEnum(CreditNoteStatus)
  status?: CreditNoteStatus;

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
  @IsNumber()
  @Min(0)
  subTotal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxTotal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  total?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items?: ItemDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  balanceAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  receivedAmount?: number;
}
