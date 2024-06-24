import { Controller, Get, Post, Body, Param, Delete, Put, HttpCode, Res } from '@nestjs/common';
import { TrainingService } from './training.service';
import { CreateTrainingDto } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { AddParticipantDto } from './dto/add-participant.dto';
import { UpdateParticipantDto } from './dto/update-participant.dto';
import { AddAttendanceToExecutionDto } from './dto/add-attendance-to-execution.dto';
import { ParticipantsService } from './services/participants.service';
import { VerifyParticipantErrorResponseDto, VerifyParticipantSuccessResponseDto } from './dto/verify-participant-response.dto';
import { Response } from 'express';
import { Readable } from 'stream';
import { CompleteTrainingBadRequestDto } from './dto/complete-training-response.dto';
import { DocumentType } from 'src/professors/entities/professor.entity';
import { CreateTrainingBadRequestDto } from './dto/create-training-response.dto';

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
    description: 'Bad Request.',
    type: CreateTrainingBadRequestDto,
  })
  create(@Body() createTrainingDto: CreateTrainingDto) {
    return this.trainingService.create(createTrainingDto);
  }

  @Get()
  @ApiResponse({
    status: 200,
    description: 'All trainings were found',
  })
  findAll() {
    return this.trainingService.findAll();
  }

  @Get('/by-document/:documentType/:documentNumber')
  @ApiResponse({
    status: 200,
    description: 'All trainings of a professor were found',
  })
  findAllByDocument(@Param('documentType') documentType: DocumentType, @Param('documentNumber') documentNumber: string) {
    return this.trainingService.findByDocument(documentType, documentNumber);
  };

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
    type: CreateTrainingBadRequestDto,
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
  @ApiResponse({
    status: 200,
    description: 'The qr code has been successfully verified',
    type: VerifyParticipantSuccessResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
    type: VerifyParticipantErrorResponseDto,
  })
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

  @Post('participants/:participantId/complete')
  @ApiResponse({
    status: 200,
    description: 'The training has been successfully completed',
  })
  @ApiResponse({
    status: 404,
    description: 'Participant not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
    type: CompleteTrainingBadRequestDto,
  })
  completeTraining(@Param('participantId') participantId: string) {
    return this.participantsService.completeTraining(participantId);
  }

  @Get('participants/:participantId/certificate')
  @ApiResponse({
    status: 200,
    description: 'The certificate has been successfully generated',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
  })
  async generateCertificate(@Param('participantId') participantId: string, @Res() res: Response){
    const buffer = await this.participantsService.getCertificate(participantId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="certificate.pdf"');
    
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    stream.pipe(res);
  }
}