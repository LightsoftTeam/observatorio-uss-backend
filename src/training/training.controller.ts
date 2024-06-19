import { Controller, Get, Post, Body, Param, Delete, Put, HttpCode } from '@nestjs/common';
import { TrainingService } from './training.service';
import { CreateTrainingDto } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { AddParticipantDto } from './dto/add-participant.dto';
import { UpdateParticipantDto } from './dto/update-participant.dto';
import { AddAttendanceToExecutionDto } from './dto/add-attendance-to-execution.dto';
import { ParticipantsService } from './services/participants.service';

@ApiTags('Training')
@Controller('training')
export class TrainingController {
  constructor(
    private readonly trainingService: TrainingService,
    private readonly participantsService: ParticipantsService,
  ) {}

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

  @HttpCode(200)
  @Post(':id/participants')
  @ApiResponse({
    status: 200,
    description: 'The participant has been successfully added.',
  })
  @ApiResponse({
    status: 404,
    description: 'Training not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
  })
  addParticipant(@Param('id') id: string, @Body() addParticipantDto: AddParticipantDto) {
    return this.participantsService.addParticipant(id, addParticipantDto);
  }

  @HttpCode(200)
  @Put(':id/participants/:participantId')
  @ApiResponse({
    status: 200,
    description: 'The participant has been successfully updated.',
  })
  @ApiResponse({
    status: 404,
    description: 'Training not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
  })
  updateParticipant(@Param('id') id: string, @Param('participantId') participantId: string, @Body() updateParticipantDto: UpdateParticipantDto) {
    return this.participantsService.updateParticipant(id, participantId, updateParticipantDto);
  }

  @HttpCode(204)
  @Delete(':id/participants/:participantId')
  @ApiResponse({
    status: 204,
    description: 'The participant has been successfully removed.',
  })
  @ApiResponse({
    status: 404,
    description: 'Training not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
  })
  removeParticipant(@Param('id') id: string, @Param('participantId') participantId: string) {
    return this.participantsService.removeParticipant(id, participantId);
  }

  @Get('participants/:participantId/verify')
  verifyParticipant(@Param('participantId') participantId: string) {
    return this.participantsService.verifyParticipant(participantId);
  }

  @HttpCode(200)
  @Post(':id/executions/:executionId/attendances')
  @ApiResponse({
    status: 200,
    description: 'The assistance has been successfully added.',
  })
  @ApiResponse({
    status: 404,
    description: 'Training not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
  })
  addAttendanceToExecution(@Param('id') id: string, @Param('executionId') executionId: string, @Body() addAttendanceToExecutionDto: AddAttendanceToExecutionDto) {
    return this.participantsService.addAttendanceToExecution(id, executionId, addAttendanceToExecutionDto);
  }
}