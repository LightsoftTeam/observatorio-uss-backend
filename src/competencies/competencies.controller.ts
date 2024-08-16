import { Controller, Get, Post, Body, Param, Delete, HttpCode, Put } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { CompetenciesService } from './competencies.service';
import { CreateCompetencyDto } from './dto/create-competency.dto';
import { UpdateCompetencyDto } from './dto/update-competency.dto';

@ApiTags('Competencies')
@Controller('competencies')
export class CompetenciesController {
  constructor(private readonly competenciesService: CompetenciesService) {}

  @Post()
  @ApiResponse({ status: 201, description: 'The record has been successfully created.'})
  create(@Body() createCompetencyDto: CreateCompetencyDto) {
    return this.competenciesService.create(createCompetencyDto);
  }

  @Get()
  @ApiResponse({ status: 200, description: 'The records have been successfully retrieved.'})
  findAll() {
    return this.competenciesService.findAll();
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'The record has been successfully retrieved.'})
  findOne(@Param('id') id: string) {
    return this.competenciesService.findOne(id);
  }

  @Put(':id')
  @ApiResponse({ status: 200, description: 'The record has been successfully updated.'})
  update(@Param('id') id: string, @Body() updateCompetencyDto: UpdateCompetencyDto) {
    return this.competenciesService.update(id, updateCompetencyDto);
  }

  @HttpCode(204)
  @Delete(':id')
  @ApiResponse({ status: 204, description: 'The record has been successfully deleted.'})
  remove(@Param('id') id: string) {
    return this.competenciesService.remove(id);
  }
}
