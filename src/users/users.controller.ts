import { BadRequestException, Body, Controller, Get, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) { }

  @ApiResponse({ status: 200, description: 'Return all users' })
  @Get()
  async findAll() {
    const users = await this.userService.findAll();
    return users.map(user => user.toJson());
  }

  @ApiResponse({ status: 201, description: 'Create a new user' })
  @ApiResponse({ status: 400, description: 'User already exists' })
  @Post()
  async create(@Body() createUserDto: CreateUserDto){
    const userExists = await this.userService.findByEmail(createUserDto.email);
    if(userExists){
      throw new BadRequestException('User already exists');
    }
    const user = await this.userService.create(createUserDto);
    delete user.password;
    return user;
  }
}