import { Module } from '@nestjs/common';
import { TrainingService } from './training.service';
import { TrainingController } from './training.controller';
import { AzureCosmosDbModule } from '@nestjs/azure-database';
import { Training } from './entities/training.entity';

@Module({
  controllers: [TrainingController],
  providers: [TrainingService],
  imports: [
    AzureCosmosDbModule.forFeature([
      {dto: Training},
    ]),
  ],
})
export class TrainingModule {}
