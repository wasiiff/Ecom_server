import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  UseGuards,
  Req,
  Put,
} from "@nestjs/common";
import { CartService } from "./cart.service";
import { AddToCartDto, UpdateCartItemDto } from "./dto/cart.dto";
import { AuthGuard } from "@nestjs/passport";

@Controller("cart")
@UseGuards(AuthGuard("jwt"))
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@Req() req: any) {
    return this.cartService.getCart(req.user._id);
  }

  @Post()
  addToCart(@Req() req: any, @Body() dto: AddToCartDto) {
    return this.cartService.addToCart(req.user._id, dto);
  }

  @Put()
  updateQuantity(@Req() req: any, @Body() dto: UpdateCartItemDto) {
    return this.cartService.updateQuantity(req.user._id, dto);
  }

  @Delete(":productId")
  removeFromCart(
    @Req() req: any,
    @Param("productId") productId: string
  ) {
    return this.cartService.removeFromCart(req.user._id, productId);
  }

  @Delete()
  clearCart(@Req() req: any) {
    return this.cartService.clearCart(req.user._id);
  }
}
