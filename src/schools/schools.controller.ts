import { Controller, Get, Post, Body, Param, Delete, Put, HttpCode } from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Schools')
@Controller('schools')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Post()
  @ApiResponse({
    status: 201,
    description: 'The school has been successfully created.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request.'
  })
  @ApiResponse({
    status: 404,
    description: 'School not found.'
  })
  create(@Body() createSchoolDto: CreateSchoolDto) {
    return this.schoolsService.create(createSchoolDto);
  }

  @Get()
  @ApiResponse({
    status: 200,
    description: 'All schools were found',
  })
  findAll() {
    return this.schoolsService.findAll();
  }

  @Get(':id')
  @ApiResponse({
    status: 200,
    description: 'A school was found',
  })
  @ApiResponse({
    status: 404,
    description: 'School not found',
  })
  findOne(@Param('id') id: string) {
    return this.schoolsService.findOne(id);
  }

  @Put(':id')
  @ApiResponse({
    status: 200,
    description: 'The school has been successfully updated.',
  })
  @ApiResponse({
    status: 404,
    description: 'School not found',
  })
  update(@Param('id') id: string, @Body() updateSchoolDto: UpdateSchoolDto) {
    return this.schoolsService.update(id, updateSchoolDto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiResponse({
    status: 204,
    description: 'The school has been successfully deleted.',
  })
  @ApiResponse({
    status: 404,
    description: 'School not found',
  })
  remove(@Param('id') id: string) {
    return this.schoolsService.remove(id);
  }
}
