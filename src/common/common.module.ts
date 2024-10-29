import { Global, Module } from '@nestjs/common';
import * as appInsights from 'applicationinsights';
import { AlgoliaService } from './services/algolia.service';
import { CommonController } from './common.controller';
import { ApplicationLoggerService } from './services/application-logger.service';
import { MailService } from './services/mail.service';
import { CommonService } from './common.service';
import { OtpService } from './services/otp.service';
import { CountriesService } from './services/countries.service';
import { AzureCosmosDbModule } from '@nestjs/azure-database';
import { UserToken } from './entities/user-token.entity';

@Global()
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
    CountriesService
  ],
  controllers: [CommonController],
  imports: [
    AzureCosmosDbModule.forFeature([
      {dto: UserToken}
    ])
  ],
  exports: [AlgoliaService, ApplicationLoggerService, MailService, CountriesService, AzureCosmosDbModule],
})
export class CommonModule { }
