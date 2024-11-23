import { InjectModel } from "@nestjs/azure-database";
import { BadRequestException, Injectable } from "@nestjs/common";
import { ApplicationLoggerService } from "src/common/services/application-logger.service";
import { AttendanceStatus, Training, TrainingParticipant } from "src/training/entities/training.entity";
import { Container } from '@azure/cosmos';
import { UsersRepository } from "./users.repository";
import { EmploymentType, Role, User } from "src/users/entities/user.entity";
import { GetProfessorParticipationBySchoolDto } from "src/reports/dto/get-professor-participation-by-school.dto";
import { SchoolsRepository } from "./schools.repository";
import { School } from "src/schools/entities/school.entity";
import { FormatCosmosItem } from "src/common/helpers/format-cosmos-item.helper";

@Injectable()
export class ProfessorReportsRepository {
  constructor(
    private readonly logger: ApplicationLoggerService,
    @InjectModel(Training)
    private readonly trainingContainer: Container,
    private readonly usersRepository: UsersRepository,
    private readonly schoolsRepository: SchoolsRepository,
  ) { }

  async getProfessorParticipationByYears() {
    const querySpec = {
      query: 'SELECT c.id, c.createdAt FROM c',
    };
    const { resources: trainingBasics } = await this.trainingContainer.items.query<{ id: string, createdAt: string }>(querySpec).fetchAll();
    const professorIds = (await this.usersRepository.getProfessorsForReports({ fields: ['id'] })).map(professor => professor.id);
    this.logger.debug(`Found ${professorIds.length} professors for reports`);
    const dates = trainingBasics.map((resource) => new Date(resource.createdAt));
    const distinctYears = [...new Set(dates.map((date) => date.getFullYear()))];
    this.logger.debug(`Distinct years: ${distinctYears}`);
    const report = {};
    const startDate = new Date();
    for (const year of distinctYears) {
      report[year] = {
        [AttendanceStatus.ATTENDED]: 0,
        [AttendanceStatus.PENDING]: 0,
      };

      const querySpec = {
        query: `
                SELECT c.id AS trainingId, p.id AS participantId, p.attendanceStatus, p.foreignId FROM c JOIN p IN c.participants
                WHERE c.createdAt >= @startDate
                AND c.createdAt <= @endDate
                AND p.attendanceStatus = @status  
              `,
        parameters: [
          { name: '@startDate', value: `${year}-01-01T00:00:00.000Z` },
          { name: '@endDate', value: `${year}-12-31T23:59:59.999Z` },
          { name: '@status', value: AttendanceStatus.ATTENDED },
        ],
      }
      const { resources } = await this.trainingContainer.items.query<{ foreignId: string, attendanceStatus: AttendanceStatus, participantId: string, trainingId: string }>(querySpec).fetchAll();

      professorIds.forEach(professorId => {
        const professorTrainingsInYear = resources.some(training => training.foreignId === professorId);
        professorTrainingsInYear ? report[year][AttendanceStatus.ATTENDED]++ : report[year][AttendanceStatus.PENDING]++;
      });
    }
    this.logger.debug(`Time to get professors participation by years: ${new Date().getTime() - startDate.getTime()}ms`);
    return report;
  }

  async getParticipation(semesterId: string) {
    this.logger.debug(`Getting participation for semester ${semesterId}`);
    const professorIds = (await this.usersRepository.getProfessorsForReports({ fields: ['id'] })).map(professor => professor.id);
    const report = {
      [AttendanceStatus.ATTENDED]: 0,
      [AttendanceStatus.PENDING]: 0,
    };

    const querySpec = {
      query: `
                SELECT c.id AS trainingId, p.id AS participantId, p.attendanceStatus, p.foreignId 
                FROM c JOIN p IN c.participants
                WHERE c.semesterId = @semesterId
                AND p.attendanceStatus = @status  
              `,
      parameters: [
        { name: '@status', value: AttendanceStatus.ATTENDED },
        { name: '@semesterId', value: semesterId },
      ],
    }

    const { resources } = await this.trainingContainer.items.query<{ foreignId: string, attendanceStatus: AttendanceStatus, participantId: string, trainingId: string }>(querySpec).fetchAll();
    this.logger.debug(`Found ${resources.length} participants`);

    professorIds.forEach(professorId => {
      const professorTrainingsInYear = resources.some(training => training.foreignId === professorId);
      professorTrainingsInYear ? report[AttendanceStatus.ATTENDED]++ : report[AttendanceStatus.PENDING]++;
    });
    return report;
  }

  async getEmploymentTypeReport(semesterId: string) {
    const professors = await this.usersRepository.getProfessorsForReports({
      fields: ['id', 'employmentType'],
    });
    const report = {
      [EmploymentType.FULL_TIME]: {
        [AttendanceStatus.ATTENDED]: 0,
        [AttendanceStatus.PENDING]: 0,
      },
      [EmploymentType.PART_TIME]: {
        [AttendanceStatus.ATTENDED]: 0,
        [AttendanceStatus.PENDING]: 0,
      },
    };

    const querySpec = {
      query: `
                SELECT p.attendanceStatus, p.foreignId 
                FROM c JOIN p IN c.participants 
                WHERE c.semesterId = @semesterId
                AND p.attendanceStatus = @status  
              `,
      parameters: [
        { name: '@status', value: AttendanceStatus.ATTENDED },
        { name: '@semesterId', value: semesterId },
      ],
    }

    const { resources } = await this.trainingContainer.items.query<{ foreignId: string, attendanceStatus: AttendanceStatus }>(querySpec).fetchAll();
    this.logger.debug(`Found ${resources.length} participants`);
    professors.forEach((professor => {
      const professorAttended = resources.some(training => training.foreignId === professor.id);
      const professorEmploymentType = professor.employmentType;
      professorAttended ? report[professorEmploymentType][AttendanceStatus.ATTENDED]++ : report[professorEmploymentType][AttendanceStatus.PENDING]++;
    }));
    return report;
  }

  async getProfessorParticipationBySchool(getParticipationBySchoolDto: GetProfessorParticipationBySchoolDto) {
    this.logger.log(`Getting participation by school for semester: ${JSON.stringify(getParticipationBySchoolDto)}`);
    const { trainingId, semesterId } = getParticipationBySchoolDto;
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
    const [{ resources: trainings }, schools, users] = await Promise.all([
      this.trainingContainer.items.query<{ id: string, participants: TrainingParticipant[] }>(querySpec).fetchAll(),
      this.schoolsRepository.findAll(),
      this.usersRepository.getProfessorsForReports(),
    ]);
    const attendedProfessors = [];
    const report: {
      [schoolId: string]: {
        school: Partial<School>;
        attended: number;
        pending: number;
        professorsCount: number;
      }
    } = {};
    for (const school of schools) {
      report[school.id] = {
        school,
        attended: 0,
        pending: 0,
        professorsCount: users.filter(user => user.schoolId === school.id).length,
      };
    }
    this.logger.debug(`Report initialized: ${JSON.stringify(report)}`);
    this.logger.debug(`Found ${trainings.length} trainings`);
    this.logger.debug(`Found ${users.length} professors`);
    trainings.map(training => {
      this.logger.debug(`Processing training ${training.id} - it has ${training.participants.length} participants`);
      training.participants.forEach(participant => {
        const professor = users.find(professor => professor.id === participant.foreignId);
        if (!professor) {
          this.logger.debug(`Professor with id ${participant.foreignId} not found - training: ${training.id}`);
          return;
        }
        this.logger.debug(`Professor founded`);
        const isAttended = participant.attendanceStatus === AttendanceStatus.ATTENDED;
        this.logger.debug(`Professor ${professor.id} is ${isAttended ? 'attended' : 'pending'}`);
        const row = report[professor.schoolId];
        if (attendedProfessors.includes(professor.id)) {
          this.logger.debug(`Professor ${professor.id} already counted`);
          return;
        }
        if (!isAttended) {
          this.logger.debug(`Professor ${professor.id} is pending`);
        } else {
          this.logger.debug(`Professor ${professor.id} is attended`);
          row.attended += 1;
          attendedProfessors.push(professor.id);
        }
      });
    });
    const professorsResume = users.map(user => {
      const isAttended = attendedProfessors.includes(user.id);
      return {
        name: user.name,
        email: user.email,
        documentType: user.documentType,
        documentNumber: user.documentNumber,
        employmentType: user.employmentType,
        status: isAttended ? AttendanceStatus.ATTENDED : AttendanceStatus.PENDING,
      }
    });
    const participationBySchool = Object.values(report)
      .map(row => {
        row.pending = row.professorsCount - row.attended;
        row.school = FormatCosmosItem.cleanDocument(row.school);
        return row;
      });
    return {
      participationBySchool,
      professorsResume,
    }
  }
}