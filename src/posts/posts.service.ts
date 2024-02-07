import { Inject, Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { readFile } from 'fs/promises';
import { GetPostsDto } from './dto/get-posts.dto';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category, Post } from './entities/post.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
  ){}

  create(createPostDto: CreatePostDto) {
    return 'This action adds a new post';
  }

  findAll({
    category
  }: GetPostsDto) {
    return this.postsRepository.find({
      where: {
        category
      }
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
