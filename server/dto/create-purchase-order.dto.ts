import {
  IsArray,
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { ItemDto } from "./item.dto";

export class CreatePurchaseOrderDto {
  @IsMongoId()
  vendorId!: string;

  @IsString()
  @IsNotEmpty()
  quoteNumber!: string;

  @IsDateString()
  quoteDate!: string;

  @IsDateString()
  expiryDate!: string;

  @IsMongoId()
  salesmanId!: string;

  @IsMongoId()
  @IsOptional()
  projectId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value
  )
  items!: ItemDto[];

  @IsMongoId()
  @IsNotEmpty()
  branchId!: string;
}

export class UpdatePurchaseOrderDto {
  @IsMongoId()
  @IsOptional()
  vendorId?: string;

  @IsString()
  @IsOptional()
  quoteNumber?: string;

  @IsDateString()
  @IsOptional()
  quoteDate?: string;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @IsMongoId()
  @IsOptional()
  salesmanId?: string;

  @IsMongoId()
  @IsOptional()
  projectId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value
  )
  items!: ItemDto[];

  @IsMongoId()
  @IsOptional()
  branchId!: string;
}
