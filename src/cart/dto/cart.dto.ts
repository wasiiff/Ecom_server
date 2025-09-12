import { IsMongoId, IsNumber, Min, IsOptional, IsString } from "class-validator";

export class AddToCartDto {
  @IsMongoId()
  product: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  variant?: string; // color

  @IsOptional()
  @IsString()
  size?: string; // size
}

export class UpdateCartItemDto {
  @IsMongoId()
  product: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  variant?: string;

  @IsOptional()
  @IsString()
  size?: string;
}
