import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ProductReviewService } from './product-review.service';
import { CreateProductReviewDto } from './dto/create-product-review.dto';
import { UpdateProductReviewDto } from './dto/update-product-review.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('reviews')
@UseGuards(AuthGuard('jwt'))
export class ProductReviewController {
  constructor(private readonly reviewService: ProductReviewService) {}

  @Post()
  create(@Body() dto: CreateProductReviewDto, @Req() req: any) {
    return this.reviewService.create(dto, req.user._id);
  }

  @Get('product/:productId')
  findByProduct(@Param('productId') productId: string) {
    return this.reviewService.findByProduct(productId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductReviewDto) {
    return this.reviewService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.reviewService.delete(id);
  }
  // product-review.controller.ts
  @Get('recent')
  findRecent() {
    return this.reviewService.findRecent(20);
  }
}
