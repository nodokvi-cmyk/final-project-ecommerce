import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { IsAuthGuard } from '../guards/isAuth.guard';
import { Roles } from '../users/decorators/user-role.decorator';
import { UserRole } from '../users/schema/user.schema';
import { RolesGuard } from '../guards/role.guard';
import { ProductQueryDto } from './dto/product-query.dto';
import { IsValidMongoIdDto } from '../shared/dto/is-valid-mongo-id.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(IsAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  findAll(
    @Query() query: ProductQueryDto
  ) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param() {id}: IsValidMongoIdDto) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(IsAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param() {id}: IsValidMongoIdDto, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(IsAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param() {id}: IsValidMongoIdDto) {
    return this.productsService.remove(id);
  }
}
