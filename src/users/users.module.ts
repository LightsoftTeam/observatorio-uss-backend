import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { AzureCosmosDbModule } from '@nestjs/azure-database';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [
    // PostsModule,
    AzureCosmosDbModule.forFeature([
      {dto: User}
    ]),
    CommonModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, AzureCosmosDbModule],
})
export class UsersModule {}
