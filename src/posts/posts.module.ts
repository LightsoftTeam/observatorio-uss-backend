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
import { GuestsService } from 'src/guests/guests.service';
import { PostsRepository } from './repositories/post.repository';
import { GuestsModule } from 'src/guests/guests.module';

@Module({
  imports: [
    AzureCosmosDbModule.forFeature([
      {dto: Post},
      {dto: HomePost},
    ]),
    CacheModule.register(),
    CommonModule,
    forwardRef(() => UsersModule),
    GuestsModule
  ],
  controllers: [PostsController],
  providers: [PostsService, AlgoliaService, GuestsService, PostsRepository],
  exports: [PostsService, AzureCosmosDbModule, CacheModule, GuestsService, PostsRepository]
})
export class PostsModule {}
