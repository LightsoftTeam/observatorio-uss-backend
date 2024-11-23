import { Module } from '@nestjs/common';
import { TrainingService } from './training.service';
import { TrainingController } from './training.controller';
import { AzureCosmosDbModule } from '@nestjs/azure-database';
import { Training } from './entities/training.entity';
import { CommonModule } from 'src/common/common.module';
import { SchoolsService } from 'src/schools/schools.service';
import { SchoolsModule } from 'src/schools/schools.module';
import { ParticipantsService } from './services/participants.service';
import { StorageService } from 'src/storage/storage.service';
import { CompetenciesService } from 'src/competencies/competencies.service';
import { Competency } from 'src/competencies/entities/competency.entity';
import { SemestersModule } from 'src/semesters/semesters.module';
import { SemestersService } from 'src/semesters/semesters.service';
import { StorageModule } from 'src/storage/storage.module';
import { MigrationService } from './services/migration.service';
import { TrainingMigrationEvent } from './entities/training-migration-event.entity';
import { UsersModule } from 'src/users/users.module';

@Module({
  controllers: [TrainingController],
  providers: [TrainingService, SchoolsService, ParticipantsService, StorageService, CompetenciesService, SemestersService, MigrationService],
  imports: [
    AzureCosmosDbModule.forFeature([
      {dto: Training},
      {dto: Competency},
      {dto: TrainingMigrationEvent},
    ]),
    CommonModule,
    SchoolsModule,
    SemestersModule,
    StorageModule,
    UsersModule,
  ],
  exports: [
    AzureCosmosDbModule,
    SchoolsModule,
    SemestersModule,
  ],
})
export class TrainingModule {}
