import { Module } from '@nestjs/common';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';
import { AzureStorageModule } from '@nestjs/azure-storage';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [StorageController],
  providers: [StorageService],
  imports: [
    AzureStorageModule.withConfigAsync({
      useFactory: async (configService: ConfigService) => ({
        accountName: configService.get('AZURE_STORAGE_ACCOUNT'),
        containerName: configService.get('AZURE_STORAGE_CONTAINER'),
        sasKey: configService.get('AZURE_STORAGE_SAS_KEY'),
      }),
      inject: [ConfigService],
    }),
  ]
})
export class StorageModule {}
