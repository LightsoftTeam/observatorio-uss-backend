import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { AzureCosmosDbModule } from '@nestjs/azure-database';
import { Post } from './entities/post.entity';
import { HomePost } from './entities/home-post.entity';
import { AlgoliaService } from 'src/common/services/algolia.service';
import { CommonModule } from 'src/common/common.module';
import { GuestsService } from 'src/guests/guests.service';
import { PostsRepository } from './repositories/post.repository';
import { GuestsModule } from 'src/guests/guests.module';
import { UsersService } from 'src/users/users.service';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    AzureCosmosDbModule.forFeature([
      {dto: Post},
      {dto: HomePost},
    ]),
    CommonModule,
    GuestsModule,
    UsersModule,
  ],
  controllers: [PostsController],
  providers: [PostsService, AlgoliaService, GuestsService, PostsRepository, UsersService],
  exports: [PostsService, AzureCosmosDbModule, GuestsService, PostsRepository]
})
export class PostsModule {}
