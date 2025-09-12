import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/schemas/user.schema';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.productService.findAll(+page, +limit);
  }
  @Get('filter')
  filter(
    @Query('color') color?: string,
    @Query('size') size?: string,
    @Query('category') category?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.productService.filter(
      {
        color,
        size,
        category,
        minPrice: minPrice ? +minPrice : undefined,
        maxPrice: maxPrice ? +maxPrice : undefined,
      },
      +page,
      +limit,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post()
  create(@Body() dto: CreateProductDto, @Req() req: any) {
    return this.productService.create(dto, req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @Req() req: any,
  ) {
    return this.productService.update(id, dto, req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
