import { Module } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';
import { AzureCosmosDbModule } from '@nestjs/azure-database';
import { Visit } from './entities/visit.entity';
import { CacheModule } from '@nestjs/cache-manager';
import { CommonModule } from 'src/common/common.module';

@Module({
  controllers: [StatisticsController],
  providers: [StatisticsService],
  imports: [
    AzureCosmosDbModule.forFeature([{
      dto: Visit,
    }]),
    CacheModule.register(),
    CommonModule,
  ],
})
export class StatisticsModule {}
