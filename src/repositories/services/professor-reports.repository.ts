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

@Injectable()
export class ProfessorReportsRepository {
  constructor(
    private readonly logger: ApplicationLoggerService,
    @InjectModel(Training)
    private readonly trainingContainer: Container,
    @InjectModel(User)
    private readonly usersContainer: Container,
    private readonly usersRepository: UsersRepository,
    private readonly schoolsRepository: SchoolsRepository,
  ) { }

  async getProfessorParticipationByYears() {
    const querySpec = {
      query: 'SELECT c.createdAt FROM c',
    };
    const { resources: createdAtDates } = await this.trainingContainer.items.query<{ createdAt: string }>(querySpec).fetchAll();
    const professors = await this.usersRepository.findAll({
      role: Role.PROFESSOR,
    });
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

  async getParticipation(semesterId: string) {
    const professors = await this.usersRepository.findAll({
      role: Role.PROFESSOR,
    });
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

  async getEmploymentTypeReport(semesterId: string) {
    // this.logger.debug('Getting employment type report');
    // const querySpec = {
    //   query: `
    //           SELECT COUNT(1) AS count, c.employmentType 
    //           FROM c 
    //           where c.role = @role
    //           GROUP BY c.employmentType
    //         `,
    //   parameters: [
    //     { name: '@role', value: Role.PROFESSOR },
    //   ],
    // }
    // const { resources } = await this.usersContainer.items.query(querySpec).fetchAll();
    // this.logger.debug(`Employment type report resources: ${JSON.stringify(resources)}`);
    // const employmentTypes = Object.values(EmploymentType);
    // const report = employmentTypes.reduce((acc, employmentType) => {
    //   acc[employmentType] = resources.find((resource) => resource.employmentType === employmentType)?.count || 0;
    //   return acc;
    // }, {});
    // return report;
    const professors = await this.usersRepository.findAll({
      role: Role.PROFESSOR,
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
      const { resources } = await this.trainingContainer.items.query<{ foreignId: string, createdAt: string, attendanceStatus: AttendanceStatus }>(querySpec).fetchAll();
      const professorEmploymentType = professor.employmentType;
      resources.length > 0 ? report[professorEmploymentType][AttendanceStatus.ATTENDED]++ : report[professorEmploymentType][AttendanceStatus.PENDING]++;
    })));
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
      this.usersRepository.findAll({
        role: Role.PROFESSOR
      }),
    ]);
    const report: {
      [schoolId: string]: {
        school: Partial<School>;
        attended: number;
        pending: number;
        professorsCount: number;
        professorWhoAttendedIds: string[];
        professors?: Partial<User>[];
      }
    } = {};
    for (const school of schools) {
      report[school.id] = {
        school,
        attended: 0,
        pending: 0,
        professorWhoAttendedIds: [],
        professorsCount: users.filter(user => user.schoolId === school.id).length,
      };
    }
    this.logger.debug(`Found ${trainings.length} trainings`);
    this.logger.debug(`Found ${users.length} professors`);
    trainings.map(training => {
      this.logger.debug(`Processing training ${training.id} - it has ${training.participants.length} participants`);
      training.participants.forEach(participant => {
        const professor = users.find(professor => professor.id === participant.foreignId);
        if (!professor) {
          this.logger.debug(`Professor with id ${participant.foreignId} not found`);
          return;
        }
        const isAttended = participant.attendanceStatus === AttendanceStatus.ATTENDED;
        this.logger.debug(`Professor ${professor.id} is ${isAttended ? 'attended' : 'pending'}`);
        const row = report[professor.schoolId];
        if (row.professorWhoAttendedIds.includes(professor.id) || !isAttended) {
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
        row.professors = row.professorWhoAttendedIds.map(professorId => users.find(professor => professor.id === professorId));
        delete row.professorWhoAttendedIds;
        return row;
      });
  }
}