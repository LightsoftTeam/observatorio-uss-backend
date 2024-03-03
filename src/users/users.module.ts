import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { AzureCosmosDbModule } from '@nestjs/azure-database';

@Module({
  imports: [
    AzureCosmosDbModule.forFeature([
      {dto: User}
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, AzureCosmosDbModule],
})
export class UsersModule {}
