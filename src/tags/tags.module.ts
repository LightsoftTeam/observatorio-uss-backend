import { Module } from '@nestjs/common';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';
import { PostsService } from 'src/posts/posts.service';
import { PostsModule } from 'src/posts/posts.module';
import { CommonModule } from 'src/common/common.module';

@Module({
  controllers: [TagsController],
  providers: [TagsService, PostsService],
  imports: [PostsModule, CommonModule],
  exports: []
})
export class TagsModule {}