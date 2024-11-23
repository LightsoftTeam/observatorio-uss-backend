import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { CompetenciesModule } from 'src/competencies/competencies.module';
import { TrainingModule } from 'src/training/training.module';
import { CompetenciesService } from 'src/competencies/competencies.service';
import { TrainingService } from 'src/training/training.service';
import { CommonModule } from 'src/common/common.module';
import { SchoolsService } from 'src/schools/schools.service';
import { SemestersService } from 'src/semesters/semesters.service';
import { StorageService } from 'src/storage/storage.service';
import { SchoolsModule } from 'src/schools/schools.module';
import { UsersService } from 'src/users/users.service';
import { UsersModule } from 'src/users/users.module';
import { StorageModule } from 'src/storage/storage.module';
import { ProfessorReportsRepository } from 'src/repositories/services/professor-reports.repository';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, CompetenciesService, TrainingService, ProfessorReportsRepository, UsersService, SchoolsService, SemestersService, StorageService],
  imports: [
    CommonModule,
    CompetenciesModule,
    TrainingModule,
    SchoolsModule,
    UsersModule,
    StorageModule,
  ]
})
export class ReportsModule {}
