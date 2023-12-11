import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { readFile } from 'fs/promises';
import { GetPostsDto } from './dto/get-posts.dto';
import { Category } from './types/category.enum';
import * as posts from "../scrap/db/posts/posts.json";
const path = require('path');

@Injectable()
export class PostsService {
  eduNews: any[];
  eduReads: any[];
  eduBits: any[];
  eduTubes: any[];
  eduTrendsPodcast: any[];

  constructor(){
    const pathEduNews = path.join(__dirname, '../scrap/db/edu-news.json');
    const pathEduBits = path.join(__dirname, '../scrap/db/edu-bits.json');
    const pathEduReads = path.join(__dirname, '../scrap/db/edu-reads.json');
    const pathEduTubes = path.join(__dirname, '../scrap/db/edu-tube.json');
    const pathEduTrendsPodcast = path.join(__dirname, '../scrap/db/edutrendspodcast.json');
    Promise.all([
      readFile(pathEduNews),
      readFile(pathEduReads),
      readFile(pathEduBits),
      readFile(pathEduTubes),
      readFile(pathEduTrendsPodcast),
    ])
    .then(([
      eduNews,
      eduReads,
      eduBits,
      eduTubes,
      eduTrendsPodcast,
    ]) => {
      this.eduNews = JSON.parse(eduNews.toString());
      this.eduReads = JSON.parse(eduReads.toString());
      this.eduBits = JSON.parse(eduBits.toString());
      this.eduTubes = JSON.parse(eduTubes.toString());
      this.eduTrendsPodcast = JSON.parse(eduTrendsPodcast.toString());
    })
  }

  create(createPostDto: CreatePostDto) {
    return 'This action adds a new post';
  }

  findAll({
    category
  }: GetPostsDto) {
    switch (category) {
      case Category.NEWS:
        return this.eduNews;
      case Category.READS:
        return this.eduReads;
      case Category.BITS:
        return this.eduBits;
      case Category.TUBES:
        return this.eduTubes;
      case Category.PODCAST:
        return this.eduTrendsPodcast;
      default:
        return [];
    }
  }

  find() {
    const topEduNews = this.eduNews.filter(post => post.description)
    const topEduBits = this.eduBits.filter(post => post.description)
    const top = [
          ...topEduNews.slice(0, 3),
          ...topEduBits.slice(0, 2),
        ]
      const secondary = this.eduNews.slice(3, 8)
      const extras = this.eduNews.slice(8, 12)
      const tubes = this.eduTubes.slice(0, 6)
      const reads = this.eduReads.slice(0, 2)
      const resp = {
        top,
        secondary,
        extras,
        tubes,
        reads,
      }
      return resp;
  }

  findOne(slug: string) {
    return (posts as any[]).find(post => post.slug === slug);
  }

  update(id: number, updatePostDto: UpdatePostDto) {
    return `This action updates a #${id} post`;
  }

  remove(id: number) {
    return `This action removes a #${id} post`;
  }
}
