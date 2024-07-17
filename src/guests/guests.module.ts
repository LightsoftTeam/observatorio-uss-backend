import { Module } from '@nestjs/common';
import { GuestsService } from './guests.service';
import { GuestsController } from './guests.controller';
import { AzureCosmosDbModule } from '@nestjs/azure-database';
import { Guest } from './entities/guest.entity';
import { CommonModule } from 'src/common/common.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  controllers: [GuestsController],
  providers: [GuestsService],
  imports: [
    AzureCosmosDbModule.forFeature([{
      dto: Guest,
    }]),
    CommonModule,
    CacheModule.register(),
  ],
  exports: [
    AzureCosmosDbModule
  ]
})
export class GuestsModule {}
