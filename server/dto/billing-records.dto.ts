import {
  IsArray,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { BillingPaymentStatus } from "../types/enum.types";
import { Type } from "class-transformer";
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

  @IsEnum(BillingPaymentStatus)
  payment!: BillingPaymentStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items!: ItemDto[];
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
  @IsEnum(BillingPaymentStatus)
  payment?: BillingPaymentStatus;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items?: ItemDto[];
}