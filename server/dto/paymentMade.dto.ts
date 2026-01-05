import { Transform } from "class-transformer";
import {
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  Min,
  IsArray,
  IsEnum,
} from "class-validator";
import { commonStatus } from "../types/enum.types";

export class CreatePaymentMadeDto {
  @IsMongoId()
  vendorId!: string;

  @IsOptional()
  @IsMongoId()
  branchId?: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsDateString()
  date!: string;

  @IsNumber()
  @Min(0)
  bankCharge!: number;

  @IsOptional()
  @IsString()
  paymentId?: string;

  @IsOptional()
  @IsString()
  paymentMode?: string;

  @IsMongoId()
  accountId!: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  reference?: string;
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
}

export class UpdatePaymentMadeDto {
  @IsOptional()
  @IsMongoId()
  vendorId?: string;

  @IsOptional()
  @IsMongoId()
  branchId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bankCharge?: number;

  @IsOptional()
  @IsString()
  paymentId?: string;

  @IsOptional()
  @IsString()
  paymentMode?: string;

  @IsOptional()
  @IsMongoId()
  accountId?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  reference?: string;

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
}
