import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, UseInterceptors, UploadedFiles, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { IsAuthGuard } from '../guards/isAuth.guard';
import { Roles } from '../users/decorators/user-role.decorator';
import { UserRole } from '../users/schema/user.schema';
import { RolesGuard } from '../guards/role.guard';
import { ProductQueryDto } from './dto/product-query.dto';
import { IsValidMongoIdDto } from '../shared/dto/is-valid-mongo-id.dto';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(IsAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FilesInterceptor('photos', 6))
  create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles(
    new ParseFilePipe({
      fileIsRequired: false,
      validators: [
        new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
        new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
      ],
    }),
  )
  files?: Array<Express.Multer.File>
) {
    return this.productsService.create(createProductDto, files);
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
  @UseInterceptors(FilesInterceptor('photos', 6))
  update(
    @Param() {id}: IsValidMongoIdDto,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles(
    new ParseFilePipe({
      fileIsRequired: false,
      validators: [
        new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
        new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
      ],
    }),
  )
  files?: Array<Express.Multer.File>,
  ) {
    return this.productsService.update(id, updateProductDto, files);
  }

  @Delete(':id/photos')
  @UseGuards(IsAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  deleteSinglePhoto(
    @Param() {id}: IsValidMongoIdDto,
    @Body('photoUrl') photoUrl: string,
  ) {
    return this.productsService.deleteSinglePhoto(id, photoUrl);
  }

  @Delete(':id')
  @UseGuards(IsAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param() {id}: IsValidMongoIdDto) {
    return this.productsService.remove(id);
  }
}
