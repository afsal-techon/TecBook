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
  prevItemId!: string;

  @IsString()
  @IsNotEmpty()
  itemName!: string;

  @IsNumber()
  @Min(1)
  qty!: number;

  @IsNumber()
  @Min(0)
  rate!: number;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsString()
  @IsNotEmpty()
  unit!: string;

  @IsNumber()
  @Min(0)
  discount!: number;
}
