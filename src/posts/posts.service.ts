import { Inject, Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { readFile } from 'fs/promises';
import { GetPostsDto } from './dto/get-posts.dto';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category, Post } from './entities/post.entity';
import { generateUniquePostSlug } from './helpers/generate-slug.helper';
import { calculateReadTime } from './helpers/calculate-read-time.helper';
import { TagsService } from 'src/tags/tags.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    private readonly tagsService: TagsService,
    private readonly usersService: UsersService
  ){}

  async create(createPostDto: CreatePostDto) {
    const { title, category, content, imageUrl, videoUrl, podcastUrl, description, attachments, imageDescription, tags, userId } = createPostDto;
    const slug = await generateUniquePostSlug(title, this.postsRepository);
    const readingTime = content ? calculateReadTime(content) : null;
    const newTags = await Promise.all(tags.map(async tag => {
      let {id} = tag;
      if(!id){
        const newTag = await this.tagsService.create(tag);
        return newTag;
      }
      return await this.tagsService.findOne(id);
    }));
    const user = await this.usersService.findOne(userId);
    const post = new Post();
    post.title = title;
    post.slug = slug;
    post.category = category;
    post.content = content;
    post.imageUrl = imageUrl;
    post.videoUrl = videoUrl;
    post.podcastUrl = podcastUrl;
    post.description = description;
    post.attachments = attachments;
    post.imageDescription = imageDescription;
    post.readingTime = readingTime;
    post.tags = newTags;
    post.user = user;
    return this.postsRepository.save(post);
  }

  async findAll({
    category
  }: GetPostsDto) {
    const posts = await this.postsRepository.find({
      where: {
        category
      },
    });
    return posts.map(post => {
      delete post.content;
      return post;
    });
  }

  async find() {
    //TODO: order by priority
    const topEduNewsPromise = this.postsRepository.find({
      where: {
        category: Category.NEWS
      },
      take: 12
    });
    const topEduBitsPromise = this.postsRepository.find({
      where: {
        category: Category.BITS
      }
    });
    const topEdutubesPromise = this.postsRepository.find({
      where: {
        category: Category.TUBES
      },
      take: 6
    });
    const eduReadsPromise = this.postsRepository.find({  
      where: {
        category: Category.READS
      },
      take: 2
    });

    const [
      topEduNews,
      topEduBits,
      topEdutubes,
      eduReads
    ] = await Promise.all([
      topEduNewsPromise,
      topEduBitsPromise,
      topEdutubesPromise,
      eduReadsPromise
    ]);


      const resp = {
        top: [
          ...topEduNews.slice(0, 3),
          ...topEduBits.slice(0, 2),
        ],
        secondary: topEduNews.slice(3, 8),
        extras: topEduNews.slice(8, 12),
        tubes: topEdutubes,
        reads: eduReads
      }
      return resp;
  }

  findOne(slug: string) {
    return this.postsRepository.findOne({
      where: {
        slug
      }
    });
  }

  update(id: number, updatePostDto: UpdatePostDto) {
    return `This action updates a #${id} post`;
  }

  remove(id: number) {
    return `This action removes a #${id} post`;
  }
}
