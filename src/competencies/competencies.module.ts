import { Module } from '@nestjs/common';
import { CompetenciesService } from './competencies.service';
import { CompetenciesController } from './competencies.controller';
import { CommonModule } from 'src/common/common.module';
import { AzureCosmosDbModule } from '@nestjs/azure-database';
import { Competency } from './entities/competency.entity';

@Module({
  controllers: [CompetenciesController],
  providers: [CompetenciesService],
  imports: [
    AzureCosmosDbModule.forFeature([{
      dto: Competency,
    }]),
    CommonModule,
  ]
})
export class CompetenciesModule {}
