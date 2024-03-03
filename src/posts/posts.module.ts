import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { UsersService } from 'src/users/users.service';
import { AzureCosmosDbModule } from '@nestjs/azure-database';
import { Post } from './entities/post.entity';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    UsersModule,
    AzureCosmosDbModule.forFeature([
      {dto: Post}
    ]),
  ],
  controllers: [PostsController],
  providers: [PostsService, UsersService],
})
export class PostsModule {}
