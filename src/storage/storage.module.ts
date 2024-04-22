import { Module } from '@nestjs/common';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';
import { AzureStorageModule } from '@nestjs/azure-storage';
import { ConfigService } from '@nestjs/config';
import { CommonModule } from 'src/common/common.module';

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
    CommonModule,
  ]
})
export class StorageModule {}
