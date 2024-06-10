import { Module } from '@nestjs/common';
import { TrainingService } from './training.service';
import { TrainingController } from './training.controller';
import { AzureCosmosDbModule } from '@nestjs/azure-database';
import { Training } from './entities/training.entity';
import { CommonModule } from 'src/common/common.module';
import { ProfessorsService } from 'src/professors/professors.service';
import { ProfessorsModule } from 'src/professors/professors.module';

@Module({
  controllers: [TrainingController],
  providers: [TrainingService, ProfessorsService],
  imports: [
    AzureCosmosDbModule.forFeature([
      {dto: Training},
    ]),
    CommonModule,
    ProfessorsModule
  ],
})
export class TrainingModule {}
