import { BadRequestException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import type { Container } from '@azure/cosmos';
import { v4 as uuidv4 } from 'uuid';
import { CreateTrainingDto, ExecutionRequest } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';
import { InjectModel } from '@nestjs/azure-database';
import { AttendanceStatus, Execution, ExecutionAttendance, Training, TrainingParticipant, TrainingRole } from './entities/training.entity';
import { isUUID } from 'class-validator';
import { FormatCosmosItem } from 'src/common/helpers/format-cosmos-item.helper';
import { ApplicationLoggerService } from 'src/common/services/application-logger.service';
import { AddParticipantDto } from './dto/add-participant.dto';
import { ProfessorsService } from 'src/professors/professors.service';
import { UpdateParticipantDto } from './dto/update-participant.dto';
import { SchoolsService } from 'src/schools/schools.service';
import { School } from 'src/schools/entities/school.entity';
import { AddAttendanceToExecutionDto } from './dto/add-attendance-to-execution.dto';

const DDA_ORGANIZER_ID = 'DDA';

enum ERROR_CODES {
  TRAINING_CODE_ALREADY_EXISTS = 'TRAINING_CODE_ALREADY_EXISTS',
}

@Injectable()
export class TrainingService {
  constructor(
    @InjectModel(Training)
    private readonly trainingContainer: Container,
    private readonly logger: ApplicationLoggerService,
    private readonly professorService: ProfessorsService,
    private readonly schoolService: SchoolsService,
  ) { 
    this.logger.setContext(TrainingService.name);
  }

  async create(createTrainingDto: CreateTrainingDto) {
    this.logger.log('Creating training');
    const { executions, organizer, code } = createTrainingDto;
    this.validateExecutionsDateRange(executions);
    const existingTraining = await this.findByCode(code);
    if (existingTraining) {
      this.logger.log(`Training code already exists: ${code}`);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        code: ERROR_CODES.TRAINING_CODE_ALREADY_EXISTS,
        message: 'The training code already exists.',
      });
    }
    if (organizer !== DDA_ORGANIZER_ID) {
      if (!isUUID(organizer)) {
        this.logger.log('The organizer must be a valid schoolId or DDA.');
        throw new BadRequestException('The organizer must be a valid schoolId or DDA.');
      }
      const school = await this.schoolService.getById(organizer);
      if (!school) {
        this.logger.log(`The school with id ${organizer} does not exist.`);
        throw new NotFoundException('The school does not exist.');
      }
    }
    const training: Training = {
      ...createTrainingDto,
      executions: executions.map((execution) => ({
        ...execution,
        id: uuidv4(),
        attendance: []
      })),
      participants: [],
      createdAt: new Date(),
    };
    const { resource } = await this.trainingContainer.items.create(training);
    return this.toJson(resource);
  }

  async findByCode(code: string): Promise<Training | null> {
    try {
      this.logger.log(`Finding training by code: ${code}`);
      const { resources } = await this.trainingContainer.items
        .query({
          query: 'SELECT * FROM c WHERE c.code = @code',
          parameters: [{ name: '@code', value: code }],
        })
        .fetchAll();
      this.logger.log(`Found ${resources.length} trainings with code: ${code}`);
      return resources.at(0);
    } catch (error) {
      this.logger.log(`findByCode ${error.message}`);
      throw error;
    }
  }

  async findAll() {
    try {
      this.logger.log('Finding all trainings');
      const { resources } = await this.trainingContainer.items.readAll<Training>().fetchAll();
      return Promise.all(resources.map(training => this.toJson(training)));
    } catch (error) {
      this.logger.log(`findAll ${error.message}`);
      throw error;
    }
  }

  async findOne(id: string) {
    this.logger.log(`Finding training by id: ${id}`);
    try {
      const training = await this.getTrainingById(id);
      if (!training) {
        throw new NotFoundException('Training not found');
      }
      return this.toJson(training);
    } catch (error) {
      this.logger.log(`findOne ${error.message}`);
      throw error;
    }
  }

  async update(id: string, updateTrainingDto: UpdateTrainingDto) {
    this.logger.log(`Updating training by id: ${id}`);
    try {
      const training = await this.getTrainingById(id);
      if (!training) {
        throw new NotFoundException('Training not found');
      }
      const { executions } = updateTrainingDto;
      this.validateExecutionsDateRange(executions);
      let mappedExecutions: Execution[] = training.executions;
      if (executions) {
        mappedExecutions = executions.map((execution) => {
          if (!execution.id) {
            return {
              ...execution,
              id: uuidv4(),
            } as Execution;
          }
          return execution as Execution;
        });
      }
      const newTraining: Training = {
        ...training,
        ...updateTrainingDto,
        executions: mappedExecutions,
      };
      const { resource: trainingUpdated } = await this.trainingContainer.item(id, id).replace(newTraining);
      return this.toJson(trainingUpdated);
    } catch (error) {
      this.logger.log(`update ${error.message}`);
      throw error;
    }
  }

  async remove(id: string) {
    this.logger.log(`Deleting training by id: ${id}`);
    try {
      await this.trainingContainer.item(id, id).delete();
      return null;
    } catch (error) {
      this.logger.log(`remove ${error.message}`);
      throw new BadRequestException("Training not found");
    }
  }

  async addParticipant(trainingId: string, addParticipantDto: AddParticipantDto) {
    const training = await this.getTrainingById(trainingId);
    if (!training) {
      throw new NotFoundException('Training not found');
    }
    const { professorId, role } = addParticipantDto;
    if (!isUUID(professorId)) {
      throw new BadRequestException('The professorId must be a valid UUID.');
    }
    //TODO: validate that professorId exists in the database
    const participant = training.participants.find((participant) => participant.foreignId === professorId);
    if (participant) {
      throw new BadRequestException('The participant is already added to the training.');
    }
    training.participants.push({
      id: uuidv4(),
      foreignId: professorId,
      role: role ?? TrainingRole.ASSISTANT,
      attendanceStatus: AttendanceStatus.PENDING,
    });
    const { resource: trainingUpdated } = await this.trainingContainer.item(trainingId, trainingId).replace(training);
    const newParticipant = trainingUpdated.participants.find((participant) => participant.foreignId === professorId);
    return this.fillParticipant(newParticipant);
  }

  async updateParticipant(trainingId: string, participantId: string, updateParticipantDto: UpdateParticipantDto) {
    const querySpec = {
      query: `SELECT value c from c join p in c.participants where p.id = @participantId`,
      parameters: [
        { name: '@participantId', value: participantId },
      ],
    }
    const { resources } = await this.trainingContainer.items.query<Training>(querySpec).fetchAll();
    if (resources.length === 0) {
      throw new NotFoundException('Participant not found');
    }
    const training = resources[0];
    const participant = training.participants.find((participant) => participant.id === participantId);
    if (!participant) {
      throw new NotFoundException('Participant not found');
    }
    const { role, attendanceStatus } = updateParticipantDto;
    if (role) {
      participant.role = role;
    }
    if (attendanceStatus) {
      participant.attendanceStatus = attendanceStatus;
    }
    const { resource: trainingUpdated } = await this.trainingContainer.item(training.id, training.id).replace(training);
    const participantUpdated = trainingUpdated.participants.find((participant) => participant.id === participantId);
    return this.fillParticipant(participantUpdated);
  }

  async removeParticipant(trainingId: string, participantId: string) {
    this.logger.log(`Deleting participant ${participantId} from training ${trainingId}`);
    const training = await this.getTrainingById(trainingId);
    if (!training) {
      throw new NotFoundException('Training not found');
    }
    const participant = training.participants.find((participant) => participant.id === participantId);
    if (!participant) {
      throw new NotFoundException('Participant not found');
    }
    const filteredParticipants = training.participants.filter((participant) => participant.id !== participantId);
    training.participants = filteredParticipants;
    try {
      await this.trainingContainer.item(trainingId, trainingId).replace(training);
      return null;
    } catch (error) {
      this.logger.error(`deleteParticipant ${error.message}`);
      throw new BadRequestException('Participant not found');
    }
  }

  private async fillParticipant(participant: TrainingParticipant) {
    const { foreignId } = participant;
    const professor = await this.professorService.findOne(foreignId);
    return {
      ...participant,
      professor,
    };
  }

  async getTrainingById(trainingId: string): Promise<Training | null> {
    this.logger.log(`Getting training by id: ${trainingId}`);
    try {
      const { resource } = await this.trainingContainer.item(trainingId, trainingId).read<Training>();
      return resource;
    } catch (error) {
      //TODO: validate error type
      return null;
    }
  }

  private validateExecutionsDateRange(executions: ExecutionRequest[]) {
    this.logger.log('Validating executions date range');
    for (let i = 0; i < executions.length; i++) {
      const execution = executions[i];
      const from = new Date(execution.from);
      const to = new Date(execution.to);
      if (from > to) {
        this.logger.error(`Execution ${i} has an invalid date range`);
        throw new BadRequestException('The execution date range is invalid.');
      }
    }
  }

  private async toJson(training: Training) {
    const trainingWithoutCosmosProps = FormatCosmosItem.cleanDocument(training);
    let formattedOrganizer: string | Partial<School> = trainingWithoutCosmosProps.organizer;
    if (formattedOrganizer !== DDA_ORGANIZER_ID) {
      formattedOrganizer = FormatCosmosItem.cleanDocument(await this.schoolService.getById(formattedOrganizer));
    }
    return {
      ...trainingWithoutCosmosProps,
      organizer: formattedOrganizer
    }
  }

  async addAttendanceToExecution(trainingId: string, executionId: string, addAttendanceToExecutionDto: AddAttendanceToExecutionDto) {
    this.logger.log(`Adding attendance to execution ${executionId} from training ${trainingId}`);
    const training = await this.getTrainingById(trainingId);
    if (!training) {
      throw new NotFoundException('Training not found');
    }
    const execution = training.executions.find((execution) => execution.id === executionId);
    if (!execution) {
      throw new NotFoundException('Execution not found');
    }
    const { participantId, status } = addAttendanceToExecutionDto;
    const participant = training.participants.find((participant) => participant.id === participantId);
    if (!participant) {
      throw new NotFoundException('Participant not found');
    }
    const assistance = execution.attendance.find((assistance) => assistance.participantId === participantId);
    if (assistance) {
      throw new BadRequestException('The participant is already added to the execution.');
    }
    try {
      const attendance: ExecutionAttendance = {
        id: uuidv4(),
        participantId,
        status: status ?? AttendanceStatus.PRESENT,
        createdAt: new Date().toISOString(),
      }
      execution.attendance.push(attendance);
      await this.trainingContainer.item(trainingId, trainingId).replace(training);
      return attendance;
    } catch (error) {
      this.logger.error(`addAttendanceToExecution ${error.message}`);
      throw new BadRequestException('Error adding attendance to execution');
    }
  }
}