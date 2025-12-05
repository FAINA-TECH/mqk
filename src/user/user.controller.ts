// src/user/user.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  login(@Body() loginUserDto: LoginUserDto) {
    return this.userService.login(loginUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  findAll() {
    return this.userService.findAll();
  }

  @Get(':nationalId')
  @ApiOperation({ summary: 'Get a user by national ID' })
  findOne(@Param('nationalId') nationalId: string) {
    return this.userService.findOne(nationalId);
  }

  @Put(':nationalId')
  @ApiOperation({ summary: 'Update a user by national ID' })
  update(
    @Param('nationalId') nationalId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(nationalId, updateUserDto);
  }

  @Delete(':nationalId')
  @ApiOperation({ summary: 'Delete a user by national ID' })
  remove(@Param('nationalId') nationalId: string) {
    return this.userService.remove(nationalId);
  }
}
