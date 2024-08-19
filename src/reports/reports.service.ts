import { Injectable } from '@nestjs/common';
import { ApplicationLoggerService } from 'src/common/services/application-logger.service';
import { CompetenciesService } from 'src/competencies/competencies.service';
import { GetProfessorParticipationBySchoolDto } from 'src/professors/dto/get-professor-participation-by-school.dto';
import { ProfessorReportsService } from 'src/professors/services/professor-reports.service';
import { School } from 'src/schools/entities/school.entity';
import { TrainingType } from 'src/training/entities/training.entity';
import { TrainingService } from 'src/training/training.service';

@Injectable()
export class ReportsService {
    constructor(
        private readonly logger: ApplicationLoggerService,
        private readonly competenciesService: CompetenciesService,
        private readonly trainingService: TrainingService,
        private readonly professorReportsService: ProfessorReportsService,
    ) {
        this.logger.setContext(ReportsService.name);
    }

    async getTrainingsByCompetency(semesterId: string) {
        const trainingsByCompetency = await this.trainingService.getByCompetence(semesterId);
        const competencies = await this.competenciesService.findAll();
        return await Promise.all(competencies.map(async competency => {
            let counters = {};
            Object.values(TrainingType).forEach(type => {
                counters[type] = trainingsByCompetency.find(training => training.competencyId === competency.id && training.type === type)?.count ?? 0;
            });
            return {
                competency: competency.name,
                ...counters
            }
        }));
    }

    async getProfessorParticipation(semesterId: string) {
        return this.professorReportsService.getParticipation(semesterId);
    }

    async getProfessorEmploymentTypeReport() {
        return this.professorReportsService.getEmploymentTypeReport();
    }

    async getProfessorParticipationByYears() {
        return this.professorReportsService.getParticipationByYears();
    }

    async getProfessorParticipationBySchool(getProfessorParticipationBySchoolDto: GetProfessorParticipationBySchoolDto) {
        return this.trainingService.getProfessorParticipationBySchool(getProfessorParticipationBySchoolDto);
    }
}