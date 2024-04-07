import { BadRequestException, Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) { }

  @ApiOperation({ summary: 'Get users' })
  @ApiResponse({ status: 200, description: 'Return all users' })
  @Get()
  findAll(@Query('role') role: Role){
    return this.userService.findAll(role);
  }

  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Create a user' })
  @ApiResponse({ status: 201, description: 'Create a new user' })
  @ApiResponse({ status: 400, description: 'User already exists' })
  @Post()
  async create(@Body() createUserDto: CreateUserDto){
    const userExists = await this.userService.findByEmail(createUserDto.email);
    if(userExists){
      throw new BadRequestException('User already exists');
    }
    return this.userService.create(createUserDto);
  }

  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: 200, description: 'User updated succesfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Put('/:id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto){
    return this.userService.update(id, updateUserDto);
  }
}
