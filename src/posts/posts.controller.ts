import { Controller, Get, Post, Body, Param, Query, Put, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { GetPostsDto } from './dto/get-posts.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { UpdateLikesDto } from './dto/update-likes.dto';
@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @ApiOperation({ summary: 'Create a post' })
  @ApiResponse({ status: 201, description: 'The post has been successfully created.'})
  @Post()
  create(@Body() createPostDto: CreatePostDto) {
    return this.postsService.create(createPostDto);
  }

  @ApiOperation({ summary: 'Update a post' })
  @ApiResponse({ status: 200, description: 'The post has been successfully updated.'})
  @ApiResponse({ status: 404, description: 'Post not found.'})
  @ApiResponse({ status: 400, description: 'Bad request.'})
  @Put(':id')
  update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postsService.update(id, updatePostDto);
  }

  @ApiOperation({ summary: 'Get all posts' })
  @ApiResponse({ status: 200, description: 'The posts has been successfully retrieved.'})
  @Get()
  findAll(@Query() query: GetPostsDto) {
    //TODO: validate query
    return this.postsService.findAll(query);
  }

  @ApiOperation({ summary: 'Get all posts' })
  @ApiResponse({ status: 200, description: 'The posts home has been successfully retrieved.'})
  @Get('/find/home')
  find() {
    return this.postsService.find();
  }

  @ApiOperation({ summary: 'Get a post by slug' })
  @ApiResponse({ status: 200, description: 'The post has been successfully retrieved.'})
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.postsService.findBySlug(slug);
  }

  @ApiOperation({ summary: 'Delete a post' })
  @ApiResponse({ status: 204, description: 'The post has been successfully deleted.'})
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.postsService.destroy(id);
    return null;
  }

  @ApiOperation({ summary: 'Like a post' })
  @ApiResponse({ status: 200, description: 'The post has been successfully liked.'})
  @HttpCode(HttpStatus.OK)
  @Post(':id/likes')
  like(@Param('id') id: string, @Body() updateLikesDto: UpdateLikesDto) {
    return this.postsService.updateLikes(id, updateLikesDto.action);
  }

  @Post('/seed')
  seed(){
    return this.postsService.seed();
  }
}
