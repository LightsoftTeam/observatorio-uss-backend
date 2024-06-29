import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Container } from '@azure/cosmos';
import { v4 as uuidv4 } from 'uuid';
import { CreateTrainingDto, ExecutionRequest } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';
import { InjectModel } from '@nestjs/azure-database';
import { Execution, Training } from './entities/training.entity';
import { isUUID } from 'class-validator';
import { FormatCosmosItem } from 'src/common/helpers/format-cosmos-item.helper';
import { ApplicationLoggerService } from 'src/common/services/application-logger.service';
import { SchoolsService } from 'src/schools/schools.service';
import { School } from 'src/schools/entities/school.entity';
import { ProfessorsService } from 'src/professors/professors.service';
import { DocumentType } from 'src/professors/entities/professor.entity';
import { StorageService } from 'src/storage/storage.service';
import { CertificatesHelper } from 'src/common/helpers/certificates.helper';
const AdmZip = require("adm-zip");

const DDA_ORGANIZER_ID = 'DDA';

export enum ERROR_CODES {
  TRAINING_CODE_ALREADY_EXISTS = 'TRAINING_CODE_ALREADY_EXISTS',
  DATE_RANGE_INVALID = 'DATE_RANGE_INVALID',
  TRAINING_NOT_HAVE_PARTICIPANTS_WITH_CERTIFICATES = 'TRAINING_NOT_HAVE_PARTICIPANTS_WITH_CERTIFICATES',
}

export const ERRORS = {
  [ERROR_CODES.TRAINING_CODE_ALREADY_EXISTS]: {
    code: ERROR_CODES.TRAINING_CODE_ALREADY_EXISTS,
    message: 'The training code already exists.',
  },
  [ERROR_CODES.DATE_RANGE_INVALID]: {
    code: ERROR_CODES.DATE_RANGE_INVALID,
    message: 'The date range is invalid.',
  },
  [ERROR_CODES.TRAINING_NOT_HAVE_PARTICIPANTS_WITH_CERTIFICATES]: {
    code: ERROR_CODES.TRAINING_NOT_HAVE_PARTICIPANTS_WITH_CERTIFICATES,
    message: 'The training does not have participants with certificates.',
  },
}

const BASIC_FIELDS = [
  'id',
  'code',
  'name',
  'description',
  'executions',
  'place',
  'floor',
  'building',
  'organizer',
  'status',
  'modality',
  'capacity',
];

@Injectable()
export class TrainingService {
  constructor(
    @InjectModel(Training)
    private readonly trainingContainer: Container,
    private readonly logger: ApplicationLoggerService,
    private readonly schoolService: SchoolsService,
    private readonly professorsService: ProfessorsService,
    private readonly storageService: StorageService,
  ) {
    this.logger.setContext(TrainingService.name);
  }

  async create(createTrainingDto: CreateTrainingDto) {
    try {
      this.logger.log('Creating training');
      const { executions, organizer, code } = createTrainingDto;
      this.validateExecutionsDateRange(executions);
      const existingTraining = await this.getByCode(code);
      if (existingTraining) {
        this.logger.log(`Training code already exists: ${code}`);
        throw new BadRequestException(ERRORS[ERROR_CODES.TRAINING_CODE_ALREADY_EXISTS]);
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
    } catch (error) {
      this.logger.log(`create error ${error.message}`);
      throw error;
    }
  }

  async getByCode(code: string): Promise<Training | null> {
    this.logger.log(`Finding training by code: ${code}`);
    const { resources } = await this.trainingContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.code = @code',
        parameters: [{ name: '@code', value: code }],
      })
      .fetchAll();
    this.logger.log(`Found ${resources.length} trainings with code: ${code}`);
    return resources.at(0);
  }

  async findByDocument(documentType: DocumentType, documentNumber: string) {
    const professor = await this.professorsService.getByDocument({ documentType, documentNumber });
    if (!professor) {
      throw new NotFoundException(`Professor with document ${documentType} ${documentNumber} not found`);
    }
    const querySpec = {
      query: 'SELECT value c FROM c join p in c.participants where p.foreignId = @professorId',
      parameters: [
        {
          name: '@professorId',
          value: professor.id
        }
      ]
    }
    const { resources } = await this.trainingContainer.items.query(querySpec).fetchAll();
    const mappedTrainingsPromise = resources
      .map(async training => {
        const formattedTraining = await this.toJson(training);
        const participant = formattedTraining.participants.find(participant => participant.foreignId === professor.id);
        delete formattedTraining.participants;
        delete formattedTraining.executions;
        return {
          ...formattedTraining,
          participant
        };
      });
    const mappedTrainings = await Promise.all(mappedTrainingsPromise);
    return {
      professor: FormatCosmosItem.cleanDocument(professor),
      trainings: mappedTrainings
    }
  }

  async findAll() {
    try {
      this.logger.log('Finding all trainings');
      const querySpec = {
        query: `SELECT ${BASIC_FIELDS.map(f => `c.${f}`).join(', ')} FROM c`
      }
      const { resources } = await this.trainingContainer.items.query<Training>(querySpec).fetchAll();
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
      const trainingWithCode = await this.getByCode(updateTrainingDto.code);
      if (trainingWithCode && trainingWithCode.id !== id) {
        this.logger.log(`Training code already exists: ${updateTrainingDto.code}`);
        throw new BadRequestException(ERRORS[ERROR_CODES.TRAINING_CODE_ALREADY_EXISTS]);
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
      throw new NotFoundException("Training not found");
    }
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

  async downloadCertificatesByTrainingId(trainingId: string) {
    this.logger.log(`Downloading certificates for training: ${trainingId}`);
    const training = await this.getTrainingById(trainingId);
    if (!training) {
      throw new BadRequestException('Training not found');
    }
    const zip = new AdmZip();
    const participants = training.participants
      .filter(participant => participant.certificate?.url);
    if (participants.length === 0) {
      this.logger.log('No participants with certificates found');
      throw new BadRequestException(ERRORS[ERROR_CODES.TRAINING_NOT_HAVE_PARTICIPANTS_WITH_CERTIFICATES]);
    }
    for (const participant of participants) {
        const {certificate} = participant;
        const {id: certificateId} = certificate;
        const blobName = CertificatesHelper.getBlobName(certificateId);
        this.logger.log(`Getting buffer ${blobName}`);
        const buffer = await this.storageService.getBuffer({ blobName });
        if(!buffer) {
          this.logger.error(`Blob ${blobName} not found`);
          continue;
        }
        zip.addFile(CertificatesHelper.getUserFilename(certificate), buffer);
    }

    return zip.toBuffer();
  }

  private validateExecutionsDateRange(executions: ExecutionRequest[]) {
    this.logger.log('Validating executions date range');
    for (let i = 0; i < executions.length; i++) {
      const execution = executions[i];
      const from = new Date(execution.from);
      const to = new Date(execution.to);
      if (from > to) {
        this.logger.error(`Execution ${i} has an invalid date range`);
        throw new BadRequestException(ERRORS[ERROR_CODES.DATE_RANGE_INVALID]);
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
}