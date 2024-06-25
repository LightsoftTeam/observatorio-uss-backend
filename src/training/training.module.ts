import { Module } from '@nestjs/common';
import { TrainingService } from './training.service';
import { TrainingController } from './training.controller';
import { AzureCosmosDbModule } from '@nestjs/azure-database';
import { Training } from './entities/training.entity';
import { CommonModule } from 'src/common/common.module';
import { ProfessorsService } from 'src/professors/professors.service';
import { ProfessorsModule } from 'src/professors/professors.module';
import { SchoolsService } from 'src/schools/schools.service';
import { SchoolsModule } from 'src/schools/schools.module';
import { ParticipantsService } from './services/participants.service';
import { StorageService } from 'src/storage/storage.service';

@Module({
  controllers: [TrainingController],
  providers: [TrainingService, ProfessorsService, SchoolsService, ParticipantsService, StorageService],
  imports: [
    AzureCosmosDbModule.forFeature([
      {dto: Training},
    ]),
    CommonModule,
    ProfessorsModule,
    SchoolsModule,
  ],
})
export class TrainingModule {}
