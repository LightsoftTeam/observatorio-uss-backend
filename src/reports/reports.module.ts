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
import { ProfessorReportsService } from 'src/professors/services/professor-reports.service';
import { ProfessorsModule } from 'src/professors/professors.module';
import { SchoolsModule } from 'src/schools/schools.module';
import { UsersService } from 'src/users/users.service';
import { UsersModule } from 'src/users/users.module';
import { ProfessorsService } from 'src/professors/professors.service';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, CompetenciesService, TrainingService, ProfessorsService, ProfessorReportsService, UsersService, SchoolsService, SemestersService, StorageService],
  imports: [
    CommonModule,
    CompetenciesModule,
    TrainingModule,
    ProfessorsModule,
    SchoolsModule,
    UsersModule,
  ]
})
export class ReportsModule {}
