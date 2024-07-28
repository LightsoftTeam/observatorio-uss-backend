import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { AzureCosmosDbModule } from '@nestjs/azure-database';
import { Post } from './entities/post.entity';
import { HomePost } from './entities/home-post.entity';
import { AlgoliaService } from 'src/common/services/algolia.service';
import { CommonModule } from 'src/common/common.module';
import { PostsRepository } from './repositories/post.repository';
import { UsersService } from 'src/users/users.service';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    AzureCosmosDbModule.forFeature([
      {dto: Post},
      {dto: HomePost},
    ]),
    CommonModule,
    UsersModule,
  ],
  controllers: [PostsController],
  providers: [PostsService, AlgoliaService, PostsRepository, UsersService],
  exports: [PostsService, AzureCosmosDbModule, PostsRepository]
})
export class PostsModule {}
