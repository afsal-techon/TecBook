import { Transform } from "class-transformer";
import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class ItemDto {
  @IsMongoId()
  itemId!: string;

  @Transform(({ value }) =>
    value === "no-tax" || value === "" || value === null ? undefined : value
  )
  @IsOptional()
  @IsMongoId()
  taxId?: string;

  @IsMongoId()
  @IsOptional()

  prevItemId!: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  itemName?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  qty?: number;

  @IsNumber()
  @Min(0)
  rate!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  unit?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @Transform(({ value }) => value === "" || value === null ? undefined : value)
  @IsOptional()
  @IsMongoId()
  customerId?: string;

  @Transform(({ value }) => value === "" || value === null ? undefined : value)
  @IsOptional()
  @IsMongoId()
  accountId?: string;

}
