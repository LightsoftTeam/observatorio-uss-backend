import { Module } from '@nestjs/common';
import * as appInsights from 'applicationinsights';
import { AlgoliaService } from './services/algolia.service';
import { CommonController } from './common.controller';
import { ApplicationLoggerService } from './services/application-logger.service';

@Module({
  providers: [
    AlgoliaService,
    {
      provide: 'ApplicationInsight',
      useFactory: () => {
          appInsights.setup(process.env.APPINSIGHTS_INSTRUMENTATIONKEY);
          appInsights.start();
          return appInsights.defaultClient;
      }
  },
  ApplicationLoggerService
  ],
  controllers: [CommonController],
  exports: [AlgoliaService, ApplicationLoggerService]
})
export class CommonModule {}
