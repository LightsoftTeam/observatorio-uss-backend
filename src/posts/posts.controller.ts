import { Controller, Get, Post, Body, Param, Query, Put, Delete, HttpCode, HttpStatus, UseGuards, UnauthorizedException } from '@nestjs/common';
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
  constructor(private postsService: PostsService) {}

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

  @UseGuards(AuthGuard)
  @Post("/update-home-post/:id")
  updateHomePosts(@Param('id') id: string, @Body() updateHomePostsDto: UpdateHomePostDto){
    return this.postsService.updateHomePosts(id, updateHomePostsDto);
  }

  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  @ApiOperation({ summary: 'Update a post' })
  @ApiResponse({ status: 200, description: 'The post has been successfully updated.'})
  @ApiResponse({ status: 404, description: 'Post not found.'})
  @ApiResponse({ status: 400, description: 'Bad request.'})
  @Put(':id')
  update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postsService.update(id, updatePostDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all posts' })
  @ApiResponse({ status: 200, description: 'The posts has been successfully retrieved.'})
  findAll(@Query() query: GetPostsDto) {
    //TODO: validate query
    return this.postsService.findAll(query);
  }

  @Get('find/home')
  @ApiOperation({ summary: 'Get home posts' })
  @ApiResponse({ status: 200, description: 'The home posts has been successfully retrieved.'})
  getHomePosts(@Query('') _: string) {
    return this.postsService.getHomePosts();
  }

  @Get('find/requests')
  @ApiOperation({ summary: 'Get post requests' })
  @ApiResponse({ status: 200, description: 'The post requests has been successfully retrieved.'})
  getPostRequests(@Query('') _: string) {
    return this.postsService.findPostRequests();
  }

  @ApiOperation({ summary: 'Get a post by slug' })
  @ApiResponse({ status: 200, description: 'The post has been successfully retrieved.'})
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.postsService.findBySlug(slug);
  }

  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Toggle state of a post' })
  @ApiResponse({ status: 200, description: 'The post has been successfully toggled.'})
  @ApiResponse({ status: 401, description: 'Unauthorized.'})
  @Post(':id/toggle-active-state')
  toggleActiveState(@Param('id') id: string) {
    return this.postsService.toggleActiveState(id);
  }

  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
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

  @UseGuards(AuthGuard)
  @Post('update-slugs')
  updateSlugs() {
    return this.postsService.updateSlugs();
  }

  @Post('seed')
  seed() {
    return this.postsService.seed();
  } 

  @ApiOperation({ summary: 'Create a post request' })
  @ApiResponse({ status: 201, description: 'The post request has been successfully created.'})
  @Post('create-request')
  createRequest(@Body() createPostDto: CreatePostDto) {
    return this.postsService.create({
      ...createPostDto,
      isPendingApproval: true,
    });
  }

  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Accept a post request' })
  @ApiResponse({ status: 200, description: 'The post request has been successfully accepted.'})
  @Post('accept-request/:id')
  acceptRequest(@Param('id') id: string) {
    return this.postsService.acceptPostRequest(id);
  }
}
