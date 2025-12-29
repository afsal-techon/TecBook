import { IsArray, IsDateString, IsEnum, IsMongoId, IsNotEmpty, IsString, ValidateNested } from "class-validator";
import { TaxPreferences } from "../types/enum.types";
import { Type } from "class-transformer";
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
  @IsNotEmpty()
  taxPreference!: TaxPreferences;

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
}