import { Module } from '@nestjs/common';
import { GuestsService } from './guests.service';
import { GuestsController } from './guests.controller';
import { AzureCosmosDbModule } from '@nestjs/azure-database';
import { Guest } from './entities/guest.entity';
import { CommonModule } from 'src/common/common.module';
import { OtpService } from 'src/common/services/otp.service';

@Module({
  controllers: [GuestsController],
  providers: [GuestsService, OtpService],
  imports: [
    AzureCosmosDbModule.forFeature([{
      dto: Guest,
    }]),
    CommonModule,
  ],
  exports: [
    AzureCosmosDbModule,
    OtpService
  ]
})
export class GuestsModule {}
