import {
  IsArray,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
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
