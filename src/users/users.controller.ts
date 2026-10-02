import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../shared/dto/pagination.dto.js';
import { IsValidMongoIdDto } from '../shared/dto/is-valid-mongo-id.dto.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(
    @Query() paginationDto: PaginationDto
  ) {
    return this.usersService.findAll(paginationDto)
  }

  @Get(':id')
  findOne(@Param('id') {id}: IsValidMongoIdDto) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') {id}: IsValidMongoIdDto, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') {id}: IsValidMongoIdDto) {
    return this.usersService.remove(id);
  }
}
