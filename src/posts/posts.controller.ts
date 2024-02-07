import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { GetPostsDto } from './dto/get-posts.dto';
@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @ApiResponse({ status: 201, description: 'The post has been successfully created.'})
  @Post()
  create(@Body() createPostDto: CreatePostDto) {
    return this.postsService.create(createPostDto);
  }

  @ApiResponse({ status: 200, description: 'The posts has been successfully retrieved.'})
  @Get()
  findAll(@Query() query: GetPostsDto) {
    //TODO: validate query
    return this.postsService.findAll(query);
  }

  @ApiResponse({ status: 200, description: 'The posts home has been successfully retrieved.'})
  @Get('/find/home')
  find() {
    return this.postsService.find();
  }

  @ApiResponse({ status: 200, description: 'The post has been successfully retrieved.'})
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.postsService.findOne(slug);
  }
}
