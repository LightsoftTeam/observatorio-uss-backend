import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Container } from '@azure/cosmos';
import { v4 as uuidv4 } from 'uuid';
import { CreateTrainingDto, ExecutionRequest } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';
import { InjectModel } from '@nestjs/azure-database';
import { AttendanceStatus, Execution, Training, TrainingParticipant, TrainingType } from './entities/training.entity';
import { isUUID } from 'class-validator';
import { FormatCosmosItem } from 'src/common/helpers/format-cosmos-item.helper';
import { ApplicationLoggerService } from 'src/common/services/application-logger.service';
import { SchoolsService } from 'src/schools/schools.service';
import { School } from 'src/schools/entities/school.entity';
import { ProfessorsService } from 'src/professors/professors.service';
import { StorageService } from 'src/storage/storage.service';
import { CertificatesHelper } from 'src/common/helpers/certificates.helper';
import { DocumentType } from 'src/common/types/document-type.enum';
import { ERROR_CODES, APP_ERRORS } from '../common/constants/errors.constants';
import { CompetenciesService } from 'src/competencies/competencies.service';
import { SemestersService } from 'src/semesters/semesters.service';
import { GetProfessorParticipationBySchoolDto } from 'src/professors/dto/get-professor-participation-by-school.dto';
import { Professor } from 'src/professors/entities/professor.entity';
const AdmZip = require("adm-zip");

const DDA_ORGANIZER_ID = 'DDA';

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
  'competencyId',
  'semesterId',
  'type',
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
    private readonly competenciesService: CompetenciesService,
    private readonly semestersService: SemestersService,
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
        throw new BadRequestException(APP_ERRORS[ERROR_CODES.TRAINING_CODE_ALREADY_EXISTS]);
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
      await this.competenciesService.findOne(createTrainingDto.competencyId);
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
    return resources.at(0) ?? null;
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
        const formattedTraining = (await this.toJson(training)) as Training;
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
      return this.toJson(resources);
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
        throw new BadRequestException(APP_ERRORS[ERROR_CODES.TRAINING_CODE_ALREADY_EXISTS]);
      }
      const { executions, competencyId } = updateTrainingDto;
      this.validateExecutionsDateRange(executions);
      let mappedExecutions: Execution[] = training.executions;
      if (executions) {
        mappedExecutions = executions.map((execution) => {
          if (!execution.id) {
            const newExecution: Execution = {
              ...execution,
              id: uuidv4(),
              attendance: []
            };
            return newExecution;
          }
          return execution as Execution;
        });
      }
      if (competencyId && training.competencyId !== competencyId) {
        await this.competenciesService.findOne(competencyId);
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
      .filter(participant => participant.certificates.length > 0);
    if (participants.length === 0) {
      this.logger.log('No participants with certificates found');
      throw new BadRequestException(APP_ERRORS[ERROR_CODES.TRAINING_NOT_HAVE_PARTICIPANTS_WITH_CERTIFICATES]);
    }
    for (const participant of participants) {
      const { certificates } = participant;
      for (const certificate of certificates) {
        const { id: certificateId } = certificate;
        const blobName = CertificatesHelper.getBlobName(certificateId);
        this.logger.log(`Getting buffer ${blobName}`);
        const buffer = await this.storageService.getBuffer({ blobName });
        if (!buffer) {
          this.logger.error(`Blob ${blobName} not found`);
          continue;
        }
        zip.addFile(CertificatesHelper.getUserFilename(certificate), buffer);
      }
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
        throw new BadRequestException(APP_ERRORS[ERROR_CODES.DATE_RANGE_INVALID]);
      }
    }
  }

  async getAsistanceBySchool(trainingId: string) {
    const training = await this.getTrainingById(trainingId);
    if (!training) {
      throw new BadRequestException('Training not found');
    }
    const schools = await this.schoolService.findAll();
    const report: {
      [schoolId: string]: {
        school: Partial<School>;
        attended: number;
        pending: number;
      }
    } = {};
    for (const school of schools) {
      report[school.id] = {
        school,
        attended: 0,
        pending: 0,
      };
    }
    await Promise.all(training.participants.map(async participant => {
      const professor = await this.professorsService.getById(participant.foreignId);
      if (!professor) {
        return;
      }
      report[professor.schoolId].attended += participant.attendanceStatus === AttendanceStatus.ATTENDED ? 1 : 0;
      report[professor.schoolId].pending += participant.attendanceStatus === AttendanceStatus.PENDING ? 1 : 0;
    }));
    return Object.values(report);
  }

  async getProfessorParticipationBySchool(getProfessorParticipationBySchoolDto: GetProfessorParticipationBySchoolDto) {
    this.logger.log(`Getting professor participation by school for semester: ${JSON.stringify(getProfessorParticipationBySchoolDto)}`);
    const { trainingId, semesterId } = getProfessorParticipationBySchoolDto;
    if (!semesterId && !trainingId) {
      throw new BadRequestException('SemesterId or trainingId is required');
    }
    const querySpec = {
      query: `SELECT c.id, c.participants FROM c WHERE c.semesterId = @semesterId or c.id = @trainingId`,
      parameters: [
        {
          name: '@semesterId',
          value: semesterId
        },
        {
          name: '@trainingId',
          value: trainingId
        }
      ]
    }
    const [{ resources: trainings }, schools, professors] = await Promise.all([
      this.trainingContainer.items.query<{ id: string, participants: TrainingParticipant[] }>(querySpec).fetchAll(),
      this.schoolService.findAll(),
      this.professorsService.findAll(),
    ]);
    const report: {
      [schoolId: string]: {
        school: Partial<School>;
        attended: number;
        pending: number;
        professorsCount: number;
        professorWhoAttendedIds: string[];
        professors?: Partial<Professor>[];
      }
    } = {};
    for (const school of schools) {
      report[school.id] = {
        school,
        attended: 0,
        pending: 0,
        professorWhoAttendedIds: [],
        professorsCount: professors.filter(professor => professor.schoolId === school.id).length,
      };
    }
    this.logger.debug(`Found ${trainings.length} trainings`);
    this.logger.debug(`Found ${professors.length} professors`);
    trainings.map(training => {
      this.logger.debug(`Processing training ${training.id} - it has ${training.participants.length} participants`);
      training.participants.forEach(participant => {
        const professor = professors.find(professor => professor.id === participant.foreignId);
        if (!professor) {
          this.logger.debug(`Professor with id ${participant.foreignId} not found`);
          return;
        }
        const isAttended = participant.attendanceStatus === AttendanceStatus.ATTENDED;
        this.logger.debug(`Professor ${professor.id} is ${isAttended ? 'attended' : 'pending'}`);
        const row = report[professor.schoolId];
        if(row.professorWhoAttendedIds.includes(professor.id) || !isAttended) {
          return;
        }
        this.logger.debug(`Counting professor ${professor.id}`);
        row.attended += 1;
        row.professorWhoAttendedIds.push(professor.id);
      });
    });
    return Object.values(report)
      .map(row => {
        row.pending = row.professorsCount - row.attended;
        row.professors = row.professorWhoAttendedIds.map(professorId => professors.find(professor => professor.id === professorId));
        delete row.professorWhoAttendedIds;
        return row;
      });
  }

  async getAsistance(id: string) {
    const training = await this.getTrainingById(id);
    if (!training) {
      throw new NotFoundException('Training not found');
    }
    const report: {
      attended: number;
      pending: number;
    } = {
      attended: 0,
      pending: 0,
    }
    await Promise.all(training.participants.map(async participant => {
      report.attended += participant.attendanceStatus === AttendanceStatus.ATTENDED ? 1 : 0;
      report.pending += participant.attendanceStatus === AttendanceStatus.PENDING ? 1 : 0;
    }));
    return report;
  }

  async getByCompetence(semesterId: string): Promise<{ count: number, competencyId: string, type: TrainingType }[]> {
    const querySpec = {
      // query: `SELECT COUNT(1) FROM c WHERE c.semesterId = @semesterId`,
      query: `
        SELECT COUNT(1) AS count, c.competencyId, c.type 
        FROM c 
        WHERE c.semesterId = @semesterId
        GROUP BY c.competencyId, c.type
      `,
      parameters: [{ name: '@semesterId', value: semesterId }]
    }
    const { resources } = await this.trainingContainer.items.query(querySpec).fetchAll();
    console.log(resources);
    return resources;
  }

  private async toJson(payload: Training | Training[]): Promise<Training | Training[]> {
    //TODO: refactor this method
    const trainings = Array.isArray(payload) ? payload : [payload];
    const competenceIds = trainings.map(training => training.competencyId);
    const semesterIds = trainings.map(training => training.semesterId);
    const organizersIds: (string | Partial<School>)[] = trainings.map(training => training.organizer);
    this.logger.log(`Fetching competencies with ids: ${competenceIds}`);
    const [competencies, semesters, schools] = await Promise.all([
      this.competenciesService.getByIds(competenceIds),
      this.semestersService.getByIds(semesterIds),
      this.schoolService.getByIds(organizersIds as string[]),
    ]);
    const formattedTrainings = trainings.map((training, index) => {
      const competency = competencies.find(competency => competency.id === training.competencyId);
      const organizer = schools.find(school => school.id === training.organizer);
      const semester = semesters.find(semester => semester.id === training.semesterId);
      return {
        ...training,
        organizer,
        competency,
        semester
      };
    });
    return Array.isArray(payload) ? formattedTrainings : formattedTrainings[0];
  }
}