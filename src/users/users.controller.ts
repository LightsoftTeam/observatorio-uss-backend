import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
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

  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get users' })
  @ApiResponse({ status: 200, description: 'Return all users' })
  @Get()
  findAll(@Query('role') role: Role){
    return this.userService.findAll(role);
  }

  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  @ApiOperation({ summary: 'Create a user' })
  @ApiResponse({ status: 201, description: 'Create a new user' })
  @ApiResponse({ status: 400, description: 'User already exists' })
  @Post()
  async create(@Body() createUserDto: CreateUserDto){
    this.userService.revokeWhenIsNotAdmin();
    const userExists = await this.userService.findByEmail(createUserDto.email);
    if(userExists){
      throw new BadRequestException('User already exists');
    }
    return this.userService.create(createUserDto);
  }

  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: 200, description: 'User updated succesfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Put('/:id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto){
    this.userService.revokeWhenIsNotAdmin();
    return this.userService.update(id, updateUserDto);
  }

  // @UseGuards(AuthGuard)
  // @HttpCode(204)
  // @ApiOperation({ summary: 'Delete a user' })
  // @ApiResponse({ status: 204, description: 'User deleted succesfully' })
  // @ApiResponse({ status: 404, description: 'User not found' })
  // @Delete('/:id')
  // remove(@Param('id') id: string){
  //   this.userService.revokeWhenIsNotAdmin();
  //   return this.userService.remove(id);
  // }

  @HttpCode(200)
  @ApiOperation({ summary: 'Toggle active state of a user' })
  @Post('/:id/toggle-active-state')
  toggleActiveState(@Param('id') id: string){
    return this.userService.toggleActiveState(id);
  }
    
}
