import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFile, UseGuards, ForbiddenException, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../shared/dto/pagination.dto.js';
import { IsValidMongoIdDto } from '../shared/dto/is-valid-mongo-id.dto.js';
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from 'multer';
import { IsAuthGuard } from '../guards/isAuth.guard';
import { UserId } from './decorators/user.decorator';


@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch(':id/avatar')
  @UseGuards(IsAuthGuard)
  @UseInterceptors(FileInterceptor('avatar', { storage: memoryStorage() }))
  uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }), 
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Param("id") {id}: IsValidMongoIdDto,
    @UserId() userId
  ){
    if(userId !== id) throw new ForbiddenException("No permission")
    return this.usersService.uploadAvatar(file, id)
  }

  @Delete(":id/avatar")
  @UseGuards(IsAuthGuard)
  deleteAvatar(
    @Param("id") {id}: IsValidMongoIdDto,
    @UserId() userId
  ){
    if(userId !== id) throw new ForbiddenException("No permission")
    return this.usersService.deleteAvatar(id)
  }

  @Get()
  findAll(
    @Query() paginationDto: PaginationDto
  ) {
    return this.usersService.findAll(paginationDto)
  }

  @Get(':id')
  findOne(@Param("id") {id}: IsValidMongoIdDto) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(IsAuthGuard)
  update(
    @Param("id") {id}: IsValidMongoIdDto, 
    @Body() updateUserDto: UpdateUserDto,
    @UserId() userId
  ) {
    if(userId !== id) throw new ForbiddenException("No permission")
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(IsAuthGuard)
  remove(
    @Param("id") {id}: IsValidMongoIdDto,
    @UserId() userId
  ){
    if(userId !== id) throw new ForbiddenException("No permission")
    return this.usersService.remove(id);
  }
}
