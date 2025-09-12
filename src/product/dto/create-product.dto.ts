import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsEnum,
  IsMongoId,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class VariantDto {
  @IsString()
  color: string;

  @IsArray()
  @IsString({ each: true })
  images: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  sizes?: string[];

  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;
}

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  ratings?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantDto)
  @IsOptional()
  variants?: VariantDto[];

  @IsBoolean()
  @IsOptional()
  onSale?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage?: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @IsEnum(["money", "points", "hybrid"])
  type: "money" | "points" | "hybrid";

  @IsString()
  category: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  loyaltyPoints?: number;
}
