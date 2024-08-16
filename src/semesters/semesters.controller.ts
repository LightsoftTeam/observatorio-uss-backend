import { Controller, Get, Post, Body, Param, Delete, HttpCode, HttpStatus, Put } from '@nestjs/common';
import { SemestersService } from './semesters.service';
import { CreateSemesterDto } from './dto/create-semester.dto';
import { UpdateSemesterDto } from './dto/update-semester.dto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Semesters')
@Controller('semesters')
export class SemestersController {
  constructor(private readonly semestersService: SemestersService) {}

  @ApiResponse({ status: 201, description: 'Semester created successfully' })
  @Post()
  create(@Body() createSemesterDto: CreateSemesterDto) {
    return this.semestersService.create(createSemesterDto);
  }

  @ApiResponse({ status: 200, description: 'Semesters found successfully' })
  @Get()
  findAll() {
    return this.semestersService.findAll();
  }

  @ApiResponse({ status: 200, description: 'Semester found successfully' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.semestersService.findOne(id);
  }

  @ApiResponse({ status: 200, description: 'Semester updated successfully' })
  @Put(':id')
  update(@Param('id') id: string, @Body() updateSemesterDto: UpdateSemesterDto) {
    return this.semestersService.update(id, updateSemesterDto);
  }

  @ApiResponse({ status: 204, description: 'Semester deleted successfully' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.semestersService.remove(id);
  }
}
