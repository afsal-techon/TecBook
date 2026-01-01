import {
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  Min,
} from "class-validator";

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

  @IsMongoId()
  paymentModeId!: string;

  @IsMongoId()
  accountId!: string;

  @IsOptional()
  @IsString()
  note?: string;
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
  @IsMongoId()
  paymentModeId?: string;

  @IsOptional()
  @IsMongoId()
  accountId?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
