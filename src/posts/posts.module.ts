import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { UsersService } from 'src/users/users.service';
import { AzureCosmosDbModule } from '@nestjs/azure-database';
import { Post } from './entities/post.entity';
import { UsersModule } from 'src/users/users.module';
import { HomePost } from './entities/home-post.entity';
import { CacheModule } from '@nestjs/cache-manager';
import { AlgoliaService } from 'src/common/services/algolia.service';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [
    UsersModule,
    AzureCosmosDbModule.forFeature([
      {dto: Post},
      {dto: HomePost},
    ]),
    CacheModule.register(),
    CommonModule
  ],
  controllers: [PostsController],
  providers: [PostsService, UsersService, AlgoliaService],
  exports: [PostsService, AzureCosmosDbModule, CacheModule]
})
export class PostsModule {}
