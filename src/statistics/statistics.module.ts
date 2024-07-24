import { Module } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';
import { AzureCosmosDbModule } from '@nestjs/azure-database';
import { Visit } from './entities/visit.entity';
import { CommonModule } from 'src/common/common.module';

@Module({
  controllers: [StatisticsController],
  providers: [StatisticsService],
  imports: [
    AzureCosmosDbModule.forFeature([{
      dto: Visit,
    }]),
    CommonModule,
  ],
})
export class StatisticsModule {}
