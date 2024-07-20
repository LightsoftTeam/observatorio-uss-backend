import { Module } from '@nestjs/common';
import * as appInsights from 'applicationinsights';
import { AlgoliaService } from './services/algolia.service';
import { CommonController } from './common.controller';
import { ApplicationLoggerService } from './services/application-logger.service';
import { MailService } from './services/mail.service';
import { CacheModule } from '@nestjs/cache-manager';
import { CommonService } from './common.service';

@Module({
  providers: [
    AlgoliaService,
    {
      provide: 'ApplicationInsight',
      useFactory: () => {
        appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING);
        appInsights.start();
        return appInsights.defaultClient;
      }
    },
    ApplicationLoggerService,
    MailService,
    CommonService
  ],
  controllers: [CommonController],
  imports: [CacheModule.register()],
  exports: [AlgoliaService, ApplicationLoggerService, MailService]
})
export class CommonModule { }
