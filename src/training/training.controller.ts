import { Controller, Get, Post, Body, Param, Delete, Put, HttpCode } from '@nestjs/common';
import { TrainingService } from './training.service';
import { CreateTrainingDto } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Training')
@Controller('training')
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Post()
  @ApiResponse({
    status: 201,
    description: 'The training has been successfully created.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request.'
  })
  create(@Body() createTrainingDto: CreateTrainingDto) {
    return this.trainingService.create(createTrainingDto);
  }

  @Get()
  findAll() {
    return this.trainingService.findAll();
  }

  @Get(':id')
  @ApiResponse({
    status: 200,
    description: 'A training was found',
  })
  @ApiResponse({
    status: 404,
    description: 'Training not found',
  })
  findOne(@Param('id') id: string) {
    return this.trainingService.findOne(id);
  }

  @Put(':id')
  @ApiResponse({
    status: 200,
    description: 'The training has been successfully updated.',
  })
  @ApiResponse({
    status: 404,
    description: 'Training not found',
  })
  update(@Param('id') id: string, @Body() updateTrainingDto: UpdateTrainingDto) {
    return this.trainingService.update(id, updateTrainingDto);
  }

  @HttpCode(204)
  @Delete(':id')
  @ApiResponse({
    status: 204,
    description: 'The training has been successfully removed.',
  })
  @ApiResponse({
    status: 404,
    description: 'Training not found',
  })
  remove(@Param('id') id: string) {
    return this.trainingService.remove(id);
  }
}