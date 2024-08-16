import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { CompetenciesModule } from 'src/competencies/competencies.module';
import { TrainingModule } from 'src/training/training.module';
import { CompetenciesService } from 'src/competencies/competencies.service';
import { TrainingService } from 'src/training/training.service';
import { CommonModule } from 'src/common/common.module';
import { ProfessorsModule } from 'src/professors/professors.module';
import { ProfessorsService } from 'src/professors/professors.service';
import { SchoolsService } from 'src/schools/schools.service';
import { SemestersService } from 'src/semesters/semesters.service';
import { StorageService } from 'src/storage/storage.service';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, CompetenciesService, TrainingService, ProfessorsService, SchoolsService, SemestersService, StorageService],
  imports: [
    CommonModule,
    CompetenciesModule,
    TrainingModule,
  ]
})
export class ReportsModule {}
