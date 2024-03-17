import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { AzureCosmosDbModule } from '@nestjs/azure-database';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    AzureCosmosDbModule.forFeature([
      {dto: User}
    ]),
    CacheModule.register()
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, AzureCosmosDbModule, CacheModule],
})
export class UsersModule {}
