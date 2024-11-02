import { Module } from '@nestjs/common';
import { AppConfigurationService } from './app-configuration.service';
import { AppConfigurationController } from './app-configuration.controller';
import { AzureCosmosDbModule } from '@nestjs/azure-database';
import { AppConfiguration } from './entities/app-configuration.entity';

@Module({
  controllers: [AppConfigurationController],
  providers: [AppConfigurationService],
  imports: [
    AzureCosmosDbModule.forFeature([
      { dto: AppConfiguration },
    ]),
  ]
})
export class AppConfigurationModule {}
