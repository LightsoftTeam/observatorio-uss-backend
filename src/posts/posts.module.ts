import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { UsersService } from 'src/users/users.service';
import { AzureCosmosDbModule } from '@nestjs/azure-database';
import { Post } from './entities/post.entity';
import { UsersModule } from 'src/users/users.module';
import { HomePost } from './entities/home-post.entity';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    UsersModule,
    AzureCosmosDbModule.forFeature([
      {dto: Post},
      {dto: HomePost},
    ]),
    CacheModule.register()
  ],
  controllers: [PostsController],
  providers: [PostsService, UsersService],
})
export class PostsModule {}
