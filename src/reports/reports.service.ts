import { Injectable } from '@nestjs/common';
import { ApplicationLoggerService } from 'src/common/services/application-logger.service';
import { CompetenciesService } from 'src/competencies/competencies.service';
import { TrainingType } from 'src/training/entities/training.entity';
import { TrainingService } from 'src/training/training.service';

@Injectable()
export class ReportsService {
    constructor(
        private readonly logger: ApplicationLoggerService,
        private readonly competenciesService: CompetenciesService,
        private readonly trainingService: TrainingService,
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
}
