import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/azure-database';
import type { Container } from '@azure/cosmos';
import { ApplicationLoggerService } from 'src/common/services/application-logger.service';
import { ProfessorsService } from '../professors.service';
import { AttendanceStatus, Training } from 'src/training/entities/training.entity';
import { EmploymentType, Professor } from '../entities/professor.entity';

@Injectable()
export class ProfessorReportsService {

  constructor(
    private readonly logger: ApplicationLoggerService,
    private readonly professorsService: ProfessorsService,
    @InjectModel(Training)
    private readonly trainingContainer: Container,
    @InjectModel(Professor)
    private readonly professorsContainer: Container,
  ) {
    this.logger.setContext(ProfessorReportsService.name);
  }

  async getParticipationByYears() {
    const querySpec = {
      query: 'SELECT c.createdAt FROM c',
    }
    const { resources: createdAtDates } = await this.trainingContainer.items.query(querySpec).fetchAll();
    const professors = await this.professorsService.findAll();
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
    const professors = await this.professorsService.findAll();
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
      query: `
              SELECT COUNT(1) AS count, c.employmentType 
              FROM c 
              GROUP BY c.employmentType
            `,
    }
    // SELECT COUNT(1) AS count, c.competencyId, c.type 
    // FROM c 
    // WHERE c.semesterId = @semesterId
    // GROUP BY c.competencyId, c.type
    const { resources } = await this.professorsContainer.items.query(querySpec).fetchAll();
    this.logger.debug(`Employment type report resources: ${JSON.stringify(resources)}`);
    const employmentTypes = Object.values(EmploymentType);
    const report = employmentTypes.reduce((acc, employmentType) => {
      acc[employmentType] = resources.find((resource) => resource.employmentType === employmentType)?.count || 0;
      return acc;
    }, {});
    return report;
  }
}
