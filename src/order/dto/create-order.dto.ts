import {
  IsArray,
  IsNumber,
  IsOptional,
  IsEnum,
  ValidateNested,
  Min,
  IsString,
  IsMongoId,
} from "class-validator";
import { Type } from "class-transformer";
import { OrderStatus } from "../schemas/order.schema";

class OrderItemDto {
  @IsMongoId()
  product: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  size?: string;
}

// ✅ Add a new enum for checkout types
export enum CheckoutType {
  MONEY = "money",
  POINTS = "points",
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsOptional()
  @IsNumber()
  pointsUsed?: number;

  @IsOptional()
  @IsNumber()
  discount?: number;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  // ✅ Add checkoutType
  @IsOptional()
  @IsEnum(CheckoutType)
  checkoutType?: CheckoutType;
}
