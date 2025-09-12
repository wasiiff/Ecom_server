import { IsOptional, IsEnum } from "class-validator";
import { OrderStatus } from "../schemas/order.schema";

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}
