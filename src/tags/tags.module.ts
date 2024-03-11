import { Module } from '@nestjs/common';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';
import { PostsService } from 'src/posts/posts.service';
import { PostsModule } from 'src/posts/posts.module';

@Module({
  controllers: [TagsController],
  providers: [TagsService, PostsService],
  imports: [PostsModule],
  exports: []
})
export class TagsModule {}