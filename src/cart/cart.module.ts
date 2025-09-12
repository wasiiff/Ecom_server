import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CartService } from "./cart.service";
import { CartController } from "./cart.controller";
import { Cart, CartSchema } from "./schemas/cart.schema";
import { Product, ProductSchema } from "src/product/schemas/product.schema";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Cart.name, schema: CartSchema },{ name: Product.name, schema: ProductSchema }]),
  ],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
