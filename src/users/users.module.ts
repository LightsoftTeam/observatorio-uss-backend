import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { AzureCosmosDbModule } from '@nestjs/azure-database';
import { CacheModule } from '@nestjs/cache-manager';
import { CommonModule } from 'src/common/common.module';
import { ApplicationLoggerService } from 'src/common/services/application-logger.service';

@Module({
  imports: [
    AzureCosmosDbModule.forFeature([
      {dto: User}
    ]),
    CacheModule.register(),
    CommonModule
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, AzureCosmosDbModule, CacheModule],
})
export class UsersModule {}
