import { Controller, Get, Post, Body, Param, Query, Put, Delete, HttpCode, HttpStatus, UseGuards, Response } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { GetPostsDto } from './dto/get-posts.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { UpdateHomePostDto } from './dto/update-home-post.dto';
import { UpdateLikesDto } from './dto/update-likes.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { PostCommentsService } from './services/post-comments.service';
import { CreatePostCommentDto } from './dto/create-post-comment.dto';
import { ApprovalStatus } from './entities/post.entity';
import { UpdatePostRequestDto } from './dto/update-post-request.dto';
import { PostRequestsService } from './services/post-requests.service';
import { GetPostRequestsDto } from './dto/get-post-requests.dto';
@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(
    private postsService: PostsService,
    private postCommentsService: PostCommentsService,
    private postRequestsService: PostRequestsService,
  ) {}

  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Create a post' })
  @ApiResponse({ status: 201, description: 'The post has been successfully created.'})
  @Post()
  create(@Body() createPostDto: CreatePostDto) {
    return this.postsService.create({...createPostDto});
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

  @UseGuards(AuthGuard)
  @Get('find/requests')
  @ApiOperation({ summary: 'Get post requests' })
  @ApiResponse({ status: 200, description: 'The post requests has been successfully retrieved.'})
  getPostRequests(@Query() getPostRequestsDto: GetPostRequestsDto) {
    return this.postRequestsService.findPostRequests(getPostRequestsDto);
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

  @UseGuards(AuthGuard)
  @Post('seed')
  seed() {
    return this.postsService.seed();
  } 

  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Create a post request' })
  @ApiResponse({ status: 201, description: 'The post request has been successfully created.'})
  @Post('create-request')
  createRequest(@Body() createPostDto: CreatePostDto) {
    return this.postsService.create({
      ...createPostDto,
      approvalStatus: ApprovalStatus.PENDING,
    });
  }

  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept a post request' })
  @ApiResponse({ status: 200, description: 'The post request has been successfully accepted.'})
  @Post('update-request/:id')
  updatePostRequest(@Param('id') id: string, @Body() updatePostRequestDto: UpdatePostRequestDto) {
    return this.postRequestsService.updatePostRequest(id, updatePostRequestDto);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Get comments of a post' })
  @ApiResponse({ status: 200, description: 'The comments has been successfully retrieved.'})
  getComments(@Param('id') id: string) {
    return this.postCommentsService.findByPostId(id);
  }

  @UseGuards(AuthGuard)
  @Post(':id/comments')
  @ApiOperation({ summary: 'Create a comment' })
  @ApiResponse({ status: 201, description: 'The comment has been successfully created.'})
  createComment(@Param('id') id: string, @Body() createPostCommentDto: CreatePostCommentDto) {
    return this.postCommentsService.create(id, createPostCommentDto);
  }

  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Like a comment' })
  @ApiResponse({ status: 200, description: 'The comment has been successfully liked.'})
  @HttpCode(HttpStatus.OK)
  @Post('/:postId/comments/:postCommentId/likes')
  likeComment(@Param('postId') postId: string, @Param('postCommentId') postCommentId: string) {
    return this.postCommentsService.updateLikes({ postId, postCommentId });
  }

  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiResponse({ status: 204, description: 'The comment has been successfully deleted.'})
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':postId/comments/:postCommentId')
  async deleteComment(@Param('postId') postId: string, @Param('postCommentId') postCommentId: string) {
    return this.postCommentsService.remove(postCommentId, postId);
  }

  @Get(':id/audio')
  @ApiOperation({ summary: 'Get audio of a post' })
  @ApiResponse({ status: 200, description: 'The audio has been successfully retrieved.'})
  getAudio(@Param('id') id: string) {
    return this.postsService.getAudio(id);
  }
}
