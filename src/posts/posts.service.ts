import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { readFile } from 'fs/promises';
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

  findAll() {
    return `This action returns all posts`;
  }

  find() {
    const top = [
          ...this.eduNews.slice(0, 3),
          ...this.eduBits.slice(0, 2),
        ]
      const secondary = this.eduNews.slice(3, 8)
      const extras = this.eduNews.slice(8, 12)
      const tubes = this.eduTubes.slice(0, 5)
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
