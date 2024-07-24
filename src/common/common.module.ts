import { Module } from '@nestjs/common';
import * as appInsights from 'applicationinsights';
import { AlgoliaService } from './services/algolia.service';
import { CommonController } from './common.controller';
import { ApplicationLoggerService } from './services/application-logger.service';
import { MailService } from './services/mail.service';
import { CommonService } from './common.service';
import { OtpService } from './services/otp.service';
import { CacheModule } from '@nestjs/cache-manager';

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
    CommonService,
    OtpService,
  ],
  controllers: [CommonController],
  exports: [AlgoliaService, ApplicationLoggerService, MailService]
})
export class CommonModule { }
