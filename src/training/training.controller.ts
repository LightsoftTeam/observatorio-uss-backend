import { Controller, Get, Post, Body, Param, Delete, Put, HttpCode, Res, Query, UseGuards, HttpStatus } from '@nestjs/common';
import { TrainingService } from './training.service';
import { CreateTrainingDto } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AddParticipantDto } from './dto/add-participant.dto';
import { UpdateParticipantDto } from './dto/update-participant.dto';
import { AddAttendanceToExecutionDto } from './dto/add-attendance-to-execution.dto';
import { ParticipantsService } from './services/participants.service';
import { Response } from 'express';
import { Readable } from 'stream';
import { DocumentType } from 'src/common/types/document-type.enum';
import { TrainingBadRequestDto } from './dto/bad-response-dto';
import { VerifyParticipantSuccessResponseDto } from './dto/verify-participant-response.dto';
import { MigrationService } from './services/migration.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@ApiTags('Training')
@Controller('training')
@ApiResponse({
  status: 400,
  description: 'Bad Request',
  type: TrainingBadRequestDto,
})
export class TrainingController {
  constructor(
    private readonly trainingService: TrainingService,
    private readonly participantsService: ParticipantsService,
    private readonly migrationService: MigrationService,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Create a training' })
  @ApiResponse({
    status: 201,
    description: 'The training has been successfully created.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request.',
  })
  create(@Body() createTrainingDto: CreateTrainingDto) {
    return this.trainingService.create(createTrainingDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all trainings' })
  @ApiResponse({
    status: 200,
    description: 'All trainings were found',
  })
  findAll() {
    return this.trainingService.findAll();
  }

  @Get('/by-document/:documentType/:documentNumber')
  @ApiOperation({ summary: 'Get all trainings of a user' })
  @ApiResponse({
    status: 200,
    description: 'All trainings of a user were found',
  })
  findAllByDocument(@Param('documentType') documentType: DocumentType, @Param('documentNumber') documentNumber: string) {
    return this.trainingService.findByDocument(documentType, documentNumber);
  };

  @Get(':id')
  @ApiOperation({ summary: 'Get a training' })
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
  @ApiOperation({ summary: 'Update a training' })
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

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a training' })
  @HttpCode(204)
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

  @Post(':id/participants')
  @ApiOperation({ summary: 'Add a participant' })
  @HttpCode(200)
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

  @Get(':id/participants')
  @ApiOperation({ summary: 'Get all participants' })
  @ApiResponse({
    status: 200,
    description: 'All participants were found',
  })
  @ApiResponse({
    status: 404,
    description: 'Training not found',
  })
  findAllParticipants(@Param('id') id: string) {
    return this.participantsService.findByTrainingId(id);
  }

  @Put(':id/participants/:participantId')
  @ApiOperation({ summary: 'Update a participant' })
  @HttpCode(200)
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

  @Delete(':id/participants/:participantId')
  @ApiOperation({ summary: 'Remove a participant' })
  @HttpCode(204)
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
  @ApiOperation({ summary: 'Verify a participant' })
  @ApiResponse({
    status: 200,
    description: 'The qr code has been successfully verified',
    type: VerifyParticipantSuccessResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
  })
  verifyParticipant(@Param('participantId') participantId: string) {
    return this.participantsService.verifyParticipant(participantId);
  }

  @UseGuards(AuthGuard)
  @Post(':id/executions/:executionId/attendances')
  @ApiOperation({ summary: 'Add attendance to an execution' })
  @HttpCode(200)
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
  @ApiOperation({ summary: 'Complete a training' })
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
  })
  completeTraining(@Param('participantId') participantId: string, @Query('inLine') inLine: string) {
    return this.participantsService.completeTraining(participantId);
  }

  @Get('previews/certificate')
  async getCertificatePreview(@Res() res: Response) {
    const certificateBuffer = await this.participantsService.getCertificatePreview();
    res.setHeader('Content-Type', 'application/pdf');
    const stream = new Readable();
    stream.push(certificateBuffer);
    stream.push(null);
    stream.pipe(res);
  }

  @Get(':id/download-certificates')
  @ApiOperation({ summary: 'Download the certificates of a training' })
  @ApiResponse({
    status: 200,
    description: 'The certificates have been successfully downloaded',
  })
  @ApiResponse({
    status: 404,
    description: 'Training not found',
  })
  async downloadCertificatesByTrainingId(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.trainingService.downloadCertificatesByTrainingId(id);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="certificates.zip"');
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    stream.pipe(res);
  }

  @Get('participants/:participantId/qr')
  @ApiOperation({ summary: 'Download the qr code of a participant' })
  @ApiResponse({
    status: 200,
    description: 'The qr code has been successfully downloaded',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
  })
  async downloadQr(@Param('participantId') participantId: string, @Res() res: Response) {
    const buffer = await this.participantsService.getParticipantQr(participantId);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'attachment; filename="qr.png"');
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    stream.pipe(res);
  }

  @Get(':id/asistance')
  @ApiOperation({ summary: 'Get the assistance' })
  @ApiResponse({
    status: 200,
    description: 'The assistance was found',
  })
  @ApiResponse({
    status: 404,
    description: 'Training not found',
  })
  getAssistance(@Param('id') id: string) {
    return this.trainingService.getAsistance(id);
  }

  @Get(':id/asistance-by-school')
  @ApiOperation({ summary: 'Get the assistance by school' })
  @ApiResponse({
    status: 200,
    description: 'The assistance by school was found',
  })
  @ApiResponse({
    status: 404,
    description: 'Training not found',
  })
  getAssistanceBySchool(@Param('id') id: string) {
    return this.trainingService.getAsistanceBySchool(id);
  }
  
  @UseGuards(AuthGuard)
  @Post('migrate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Migrate data from an excel' })
  @ApiResponse({
    status: 200,
    description: 'The data has been successfully migrated',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
  })
  async migrateFromExcel() {
    return this.migrationService.migrateFromExcel();
  }
}