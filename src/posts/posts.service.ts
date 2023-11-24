import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { writeFile, readFile } from 'fs/promises';

@Injectable()
export class PostsService {
  eduNews: any[];
  eduReads: any[];
  eduBits: any[];
  eduTubes: any[];
  eduTrendsPodcast: any[];

  constructor(){
    Promise.all([
      readFile('src/scrap/db/edu-news.json'),
      readFile('src/scrap/db/edu-reads.json'),
      readFile('src/scrap/db/edu-bits.json'),
      readFile('src/scrap/db/edu-tube.json'),
      readFile('src/scrap/db/edutrendspodcast.json'),
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

  findAll() {
    return `This action returns all posts`;
  }

  find({param}: {param: string}) {
    switch(param){
      case 'top':
        return [
          ...this.eduNews.slice(0, 2),
          ...this.eduReads.slice(0, 1),
          ...this.eduBits.slice(0, 2),
        ]
      default:
        return [];
      }
  }

  findOne(id: number) {
    return `This action returns a #${id} post`;
  }

  update(id: number, updatePostDto: UpdatePostDto) {
    return `This action updates a #${id} post`;
  }

  remove(id: number) {
    return `This action removes a #${id} post`;
  }
}
