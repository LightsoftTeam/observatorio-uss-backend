import { Controller, Get, Post, Body, Param, Query, Put, Delete, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { GetPostsDto } from './dto/get-posts.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { UpdateHomePostDto } from './dto/update-home-post.dto';
import { UpdateLikesDto } from './dto/update-likes.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Create a post' })
  @ApiResponse({ status: 201, description: 'The post has been successfully created.'})
  @Post()
  create(@Body() createPostDto: CreatePostDto) {
    return this.postsService.create(createPostDto);
  }

  @Post("/update-home-post/:id")
  updateHomePosts(@Param('id') id: string, @Body() updateHomePostsDto: UpdateHomePostDto){
    return this.postsService.updateHomePosts(id, updateHomePostsDto);
  }

  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  @UseGuards(AuthGuard)
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

  @ApiOperation({ summary: 'Get home posts' })
  @ApiResponse({ status: 200, description: 'The posts home has been successfully retrieved.'})
  @Get('/find/home')
  find() {
    return this.postsService.getHomePosts();
  }

  @ApiOperation({ summary: 'Get a post by slug' })
  @ApiResponse({ status: 200, description: 'The post has been successfully retrieved.'})
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.postsService.findBySlug(slug);
  }

  @ApiOperation({ summary: 'Toggle state of a post' })
  @ApiResponse({ status: 200, description: 'The post has been successfully toggled.'})
  @ApiResponse({ status: 401, description: 'Unauthorized.'})
  @UseGuards(AuthGuard)
  @Post(':id/toggle-active-state')
  toggleActiveState(@Param('id') id: string) {
    return this.postsService.toggleActiveState(id);
  }

  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Delete a post' })
  @ApiResponse({ status: 204, description: 'The post has been successfully deleted.'})
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.postsService.remove(id);
  }

  @ApiOperation({ summary: 'Like a post' })
  @ApiResponse({ status: 200, description: 'The post has been successfully liked.'})
  @HttpCode(HttpStatus.OK)
  @Post(':id/likes')
  like(@Param('id') id: string, @Body() updateLikesDto: UpdateLikesDto) {
    return this.postsService.updateLikes(id, updateLikesDto.action);
  }
}
