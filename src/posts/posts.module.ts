import { Module, forwardRef } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { AzureCosmosDbModule } from '@nestjs/azure-database';
import { Post } from './entities/post.entity';
import { HomePost } from './entities/home-post.entity';
import { CacheModule } from '@nestjs/cache-manager';
import { AlgoliaService } from 'src/common/services/algolia.service';
import { CommonModule } from 'src/common/common.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    AzureCosmosDbModule.forFeature([
      {dto: Post},
      {dto: HomePost},
    ]),
    CacheModule.register(),
    CommonModule,
    forwardRef(() => UsersModule)
  ],
  controllers: [PostsController],
  providers: [PostsService, AlgoliaService],
  exports: [PostsService, AzureCosmosDbModule, CacheModule]
})
export class PostsModule {}
