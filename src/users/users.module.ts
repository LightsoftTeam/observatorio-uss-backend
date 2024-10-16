import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { AzureCosmosDbModule } from '@nestjs/azure-database';
import { CommonModule } from 'src/common/common.module';
import { CountriesService } from 'src/common/services/countries.service';
import { Post } from 'src/posts/entities/post.entity';

@Module({
  imports: [
    // PostsModule,
    AzureCosmosDbModule.forFeature([
      {dto: User},
      {dto: Post}
    ]),
    CommonModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, AzureCosmosDbModule],
})
export class UsersModule {}
