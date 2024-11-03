import { Injectable } from '@nestjs/common';
import { PostsService } from 'src/posts/posts.service';
import { PostsRepository } from 'src/repositories/services/post.repository';

@Injectable()
export class TagsService {
    constructor(
        private readonly postsRepository: PostsRepository
    ) { }

    findAll(search: string = '') {
        return this.postsRepository.getDistinctTags(search);
    }
}
