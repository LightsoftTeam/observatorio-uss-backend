import { Module } from '@nestjs/common';
import { TrainingService } from './training.service';
import { TrainingController } from './training.controller';
import { AzureCosmosDbModule } from '@nestjs/azure-database';
import { Training } from './entities/training.entity';
import { CommonModule } from 'src/common/common.module';

@Module({
  controllers: [TrainingController],
  providers: [TrainingService],
  imports: [
    AzureCosmosDbModule.forFeature([
      {dto: Training},
    ]),
    CommonModule,
  ],
})
export class TrainingModule {}
