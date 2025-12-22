import {
  IsArray,
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
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
  items!: ItemDto[];
}
