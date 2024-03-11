import { Injectable } from '@nestjs/common';
import { PostsService } from 'src/posts/posts.service';

@Injectable()
export class TagsService {
    constructor(
        private readonly postsService: PostsService,
    ) { }

    findAll(search: string = '') {
        return this.postsService.getDistinctTags(search);
    }
}
