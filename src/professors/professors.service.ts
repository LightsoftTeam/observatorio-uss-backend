import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Container } from '@azure/cosmos';
import { CreateProfessorDto } from './dto/create-professor.dto';
import { UpdateProfessorDto } from './dto/update-professor.dto';
import { EmploymentType, Professor } from './entities/professor.entity';
import { InjectModel } from '@nestjs/azure-database';
import { FormatCosmosItem } from 'src/common/helpers/format-cosmos-item.helper';
import { SchoolsService } from 'src/schools/schools.service';
import { ApplicationLoggerService } from 'src/common/services/application-logger.service';
import { UsersService } from 'src/users/users.service';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Generator } from 'src/common/helpers/generator.helper';
import { MailService } from 'src/common/services/mail.service';
import { DocumentType } from 'src/common/types/document-type.enum';
import { AttendanceStatus, Training } from 'src/training/entities/training.entity';
import { APP_ERRORS, ERROR_CODES } from 'src/common/constants/errors.constants';

const EXPIRATION_PRELOAD_PROFESSOR = 1000 * 60 * 10;//10 minutes

@Injectable()
export class ProfessorsService {

  constructor(
    @InjectModel(Professor)
    private readonly professorsContainer: Container,
    @InjectModel(Training)
    private readonly trainingContainer: Container,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    private readonly schoolService: SchoolsService,
    private readonly usersService: UsersService,
    private readonly logger: ApplicationLoggerService,
    private readonly mailService: MailService,
  ) { }

  async create(createProfessorDto: CreateProfessorDto) {
    this.logger.log(`Creating professor: ${JSON.stringify(createProfessorDto)}`);
    await this.schoolService.findOne(createProfessorDto.schoolId);// Check if the school exists
    const professor: Professor = {
      ...createProfessorDto,
      email: createProfessorDto.email.trim(),
      createdAt: new Date(),
    }
    await this.throwErrorIfProfessorExists(professor);
    let loggedUser = this.usersService.getLoggedUser();
    this.logger.log(`Logged user: ${JSON.stringify(loggedUser)}`);
    if (!loggedUser) {
      return this.preloadProfessor(professor);
    }
    return this.saveProfessorInDb(professor);
  }

  async saveProfessorInDb(professor: Professor) {
    await this.throwErrorIfProfessorExists(professor);
    const { resource } = await this.professorsContainer.items.create<Professor>(professor);
    return FormatCosmosItem.cleanDocument<Professor>(resource);
  }

  async preloadProfessor(professor: Professor) {
    const { email } = professor;
    //sendEmail
    const code = Generator.code(6);
    console.log({ code });
    try {
      this.mailService.sendVerificationCode({
        to: email,
        code,
        forceSend: true,
      });
    } catch (error) {
      this.logger.error('preloadProfessor error sending email');
    }
    this.cacheManager.set(code, JSON.stringify(professor), EXPIRATION_PRELOAD_PROFESSOR);//10 minutes
    return professor;
  }

  async confirmRegister(code: string) {
    const professor: string | undefined = await this.cacheManager.get(code);
    this.logger.log(`Confirming preloaded professor with code ${code}`);
    if (!professor) {
      this.logger.log(`Invalid code ${code}`);
      throw new BadRequestException(APP_ERRORS[ERROR_CODES.INVALID_OTP]);
    }
    this.cacheManager.del(code);
    this.logger.log(`Professor confirmed with code ${code}: ${professor}`);
    const professorObj = JSON.parse(professor);
    return this.saveProfessorInDb(professorObj);
  }

  private async throwErrorIfProfessorExists(professor: Professor) {
    const { documentType, documentNumber } = professor;
    const professorAlreadyExists = await this.getByDocument({ documentNumber, documentType });
    if (professorAlreadyExists) {
      throw new BadRequestException(APP_ERRORS[ERROR_CODES.PROFESSOR_ALREADY_EXISTS]);
    }
  }

  async findAll() {
    this.logger.log('Getting all professors');
    const { resources } = await this.professorsContainer.items.readAll<Professor>().fetchAll();
    return resources.map((professor) => FormatCosmosItem.cleanDocument<Professor>(professor));
  }

  async findOne(id: string) {
    this.logger.log(`Getting professor with id ${id}`);
    try {
      const { resource } = await this.professorsContainer.item(id, id).read<Professor>();
      return FormatCosmosItem.cleanDocument<Professor>(resource);
    } catch (error) {
      throw new NotFoundException(`Professor with id ${id} not found`);
    }
  }

  async update(id: string, updateProfessorDto: UpdateProfessorDto) {
    this.logger.log(`Updating professor with id ${id}: ${JSON.stringify(updateProfessorDto)}`);
    const { schoolId } = updateProfessorDto
    if (schoolId) {
      await this.schoolService.findOne(schoolId);// Check if the school exists
    }
    try {
      const { resource: professor } = await this.professorsContainer.item(id, id).read<Professor>();
      const newProfessor: Professor = {
        ...professor,
        ...updateProfessorDto,
      }
      const { resource } = await this.professorsContainer.item(id).replace(newProfessor);
      return FormatCosmosItem.cleanDocument<Professor>(resource);
    } catch (error) {
      this.logger.error(error.message)
      throw new NotFoundException(`Professor with id ${id} not found`);
    }
  }

  async remove(id: string) {
    this.logger.log(`Deleting professor with id ${id}`);
    try {
      await this.professorsContainer.item(id, id).delete();
      return null;
    } catch (error) {
      this.logger.error(error.message)
      throw new NotFoundException(`Professor with id ${id} not found`);
    }
  }

  async findByDocument({ documentType, documentNumber }: { documentType: DocumentType, documentNumber: string }) {
    const resource = await this.getByDocument({ documentType, documentNumber });
    if (!resource) {
      throw new NotFoundException(`Professor with document ${documentType} ${documentNumber} not found`);
    }
    return FormatCosmosItem.cleanDocument<Professor>(resource);
  }

  async getByDocument({ documentType, documentNumber }: { documentType: DocumentType, documentNumber: string }): Promise<Professor | null> {
    this.logger.log(`Getting professor with document ${documentType} ${documentNumber}`);
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.documentType = @documentType AND c.documentNumber = @documentNumber',
      parameters: [
        { name: '@documentType', value: documentType },
        { name: '@documentNumber', value: documentNumber },
      ],
    };
    const { resources } = await this.professorsContainer.items.query<Professor>(querySpec).fetchAll();
    if (resources.length === 0) {
      this.logger.log(`Professor with document ${documentType} ${documentNumber} not found`);
      return null;
    }
    return resources[0];
  }

  async getById(id: string) {
    try {
      this.logger.log(`Getting professor with id ${id}`);
      const { resource } = await this.professorsContainer.item(id, id).read<Professor>();
      return resource;
    } catch (error) {
      return null;
    }
  }

  async getParticipationByYears() {
    const querySpec = {
      query: 'SELECT c.createdAt FROM c',
    }
    const { resources: createdAtDates } = await this.trainingContainer.items.query(querySpec).fetchAll();
    const professors = await this.findAll();
    const dates = createdAtDates.map((resource) => new Date(resource.createdAt));
    const distinctYears = [...new Set(dates.map((date) => date.getFullYear()))];
    this.logger.debug(`Distinct years: ${distinctYears}`);
    const report = {};
    for (const year of distinctYears) {
      report[year] = {
        [AttendanceStatus.ATTENDED]: 0,
        [AttendanceStatus.PENDING]: 0,
      };
      (await Promise.all(professors.map(async (professor) => {
        const querySpec = {
          query: `
            SELECT TOP 1 c.foreignId, c.createdAt, p.attendanceStatus 
            FROM c JOIN p IN c.participants 
            WHERE p.foreignId = @id
            AND c.createdAt >= @startDate
            AND c.createdAt <= @endDate
            AND p.attendanceStatus = @status  
          `,
          parameters: [
            { name: '@id', value: professor.id },
            { name: '@startDate', value: `${year}-01-01T00:00:00.000Z` },
            { name: '@endDate', value: `${year}-12-31T23:59:59.999Z` },
            { name: '@status', value: AttendanceStatus.ATTENDED },
          ],
        }
        return this.trainingContainer.items.query<{ foreignId: string, createdAt: string, attendanceStatus: AttendanceStatus }>(querySpec).fetchAll();
      })))
        .forEach(({ resources: professorTrainingsInYear }) => professorTrainingsInYear.length > 0 ? report[year][AttendanceStatus.ATTENDED]++ : report[year][AttendanceStatus.PENDING]++);
    }
    return report;
  }

  async getParticipationBySemester(semesterId: string) {
    const professors = await this.findAll();
    const report = {
      [AttendanceStatus.ATTENDED]: 0,
      [AttendanceStatus.PENDING]: 0,
    };
    (await Promise.all(professors.map(async (professor) => {
      const querySpec = {
        query: `
            SELECT TOP 1 c.foreignId, c.createdAt, p.attendanceStatus 
            FROM c JOIN p IN c.participants 
            WHERE p.foreignId = @id
            AND c.semesterId = @semesterId
            AND p.attendanceStatus = @status  
          `,
        parameters: [
          { name: '@id', value: professor.id },
          { name: '@status', value: AttendanceStatus.ATTENDED },
          { name: '@semesterId', value: semesterId },
        ],
      }
      return this.trainingContainer.items.query<{ foreignId: string, createdAt: string, attendanceStatus: AttendanceStatus }>(querySpec).fetchAll();
    })))
      .forEach(({ resources: professorTrainingsInYear }) => professorTrainingsInYear.length > 0 ? report[AttendanceStatus.ATTENDED]++ : report[AttendanceStatus.PENDING]++);
    return report;
  }

  async getEmploymentTypeReport() {
    const querySpec = {
      query: 'SELECT COUNT(1) AS professors, c.employmentType as employmentType FROM professors c GROUP BY c.employmentType',
    }
    const { resources } = await this.professorsContainer.items.query(querySpec).fetchAll();
    const employmentTypes = Object.values(EmploymentType);
    const report = employmentTypes.reduce((acc, employmentType) => {
      acc[employmentType] = resources.find((resource) => resource.employmentType === employmentType)?.professors || 0;
      return acc;
    }, {});
    return report;
  }
}