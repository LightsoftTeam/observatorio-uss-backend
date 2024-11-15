import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Container } from '@azure/cosmos';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { GetPostsDto } from './dto/get-posts.dto';
import { ApprovalStatus, Post } from './entities/post.entity';
import { generateUniqueSlug } from './helpers/generate-slug.helper';
import { calculateReadTime } from './helpers/calculate-read-time.helper';
import { UsersService } from 'src/users/users.service';
import { InjectModel } from '@nestjs/azure-database';
import { FormatCosmosItem } from 'src/common/helpers/format-cosmos-item.helper';
import { LikeAction } from './types/like-action.type';
import { HomePost } from './entities/home-post.entity';
import { UpdateHomePostDto } from './dto/update-home-post.dto';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { AlgoliaService, PostAlgoliaRecord } from 'src/common/services/algolia.service';
import { ApplicationLoggerService } from 'src/common/services/application-logger.service';
import { Role } from 'src/users/entities/user.entity';
import { scrapedPosts } from 'src/scrap/outputs/posts';
import { PostsRepository } from './repositories/post.repository';
import { APP_ERRORS, ERROR_CODES } from 'src/common/constants/errors.constants';
import { PostComment } from './entities/post-comment.entity';
import { OpenaiService } from 'src/openai/openai.service';
import { getTextFromHtml } from 'src/common/helpers/get-text-from-html.helper';
import { StorageService } from 'src/storage/storage.service';
import { AskPostDto } from './dto/ask-post.dto';
import { from, interval, map, switchMap } from 'rxjs';
import { isUUID } from 'class-validator';

const BASIC_KEYS_LIST = [
  'id',
  'title',
  'slug',
  'category',
  'subCategory',
  'readingTime',
  'description',
  'videoUrl',
  'imageUrl',
  'likes',
  'userId',
  'reference',
  'tags',
  'createdAt',
  'approvalStatus',
  'rejectionReasons',
]

export const BASIC_KEYS = BASIC_KEYS_LIST.map(f => `c.${f}`).join(', ')
const HOME_POSTS_KEY = 'homePosts';
const TAGS_KEY = 'tags';
const LONG_CACHE_TIME = 1000 * 60 * 60 * 3;//3 hours

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post)
    private readonly postsContainer: Container,
    @InjectModel(HomePost)
    private readonly homePostsContainer: Container,
    @InjectModel(PostComment)
    private readonly postCommentsContainer: Container,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly usersService: UsersService,
    private readonly algoliaService: AlgoliaService,
    private readonly logger: ApplicationLoggerService,
    private readonly postsRepository: PostsRepository,
    private readonly openaiService: OpenaiService,
    private readonly storageService: StorageService,
  ) {
    this.logger.setContext(PostsService.name);
  }

  async create(createPostDto: CreatePostDto) {
    this.logger.log(`Creating post - ${JSON.stringify(createPostDto)}`);
    this.usersService.revokeWhenIsNotAdminOrOwner(createPostDto.userId);
    const { title, category, content, imageUrl, videoUrl, podcastUrl, description, attachments, imageDescription, tags, reference, userId, approvalStatus } = createPostDto;
    if (userId && reference) {
      throw new BadRequestException(APP_ERRORS[ERROR_CODES.INVALID_AUTHOR]);
    }
    if (userId) {
      await this.usersService.findOne(userId);//throws error if user not found
    }
    const slugsQuerySpec = {
      query: 'SELECT c.slug FROM c'
    }
    const { resources } = await this.postsContainer.items.query<{ slug: string }>(slugsQuerySpec).fetchAll();
    const slugs = resources.map(r => r.slug);
    const slug = generateUniqueSlug({ title, slugs });
    const readingTime = content ? calculateReadTime(content) : null;

    const post: Post = {
      title,
      slug,
      category,
      content,
      imageUrl,
      videoUrl,
      podcastUrl,
      description,
      attachments,
      imageDescription,
      readingTime,
      tags: tags.map(t => t.trim().toLowerCase()),
      userId,
      createdAt: new Date(),
      isActive: true,
      likes: 0,
      reference,
      approvalStatus
    }
    const { resource } = await this.postsContainer.items.create<Post>(post);
    this.algoliaService.saveObject(this.transformPostToAlgoliaRecord(post));
    this.cacheManager.del(TAGS_KEY);
    return FormatCosmosItem.cleanDocument(resource, ['content']);
  }

  async update(id: string, updatePostDto: UpdatePostDto) {
    this.logger.log(`Updating post - ${JSON.stringify(updatePostDto)}`);
    const post = await this.findOne(id);
    await this.throwErrorIfUserIsNotOwner(post);
    if (updatePostDto.tags?.length > 0) {
      updatePostDto.tags = updatePostDto.tags.map(t => t.trim().toLowerCase());
    }
    const { title, content } = updatePostDto;
    const updatedPost: Post = {
      ...post,
      ...updatePostDto
    }
    if (content && content !== post.content) {
      const readingTime = content ? calculateReadTime(content) : null;
      updatedPost.readingTime = readingTime;
      delete updatedPost.contentAudioUrl;
    }
    if (title && title !== post.title) {
      const slugs = await this.getSlugs();
      updatedPost.slug = generateUniqueSlug({ title, slugs });
    }
    let newPost: Partial<Post>;
    if (updatePostDto.category !== post.category) {
      await this.postsContainer.item(post.id, post.category).delete();
      const { resource } = await this.postsContainer.items.create(updatedPost);
      newPost = FormatCosmosItem.cleanDocument(resource, ['content']);
    } else {
      const { resource } = await this.postsContainer.item(post.id).replace(updatedPost);
      newPost = FormatCosmosItem.cleanDocument(resource, ['content']);
    }
    this.algoliaService.updateObject(this.transformPostToAlgoliaRecord(updatedPost));
    this.cacheManager.del(HOME_POSTS_KEY);
    this.cacheManager.del(TAGS_KEY);
    return newPost;
  }

  async getSlugs() {
    const slugsQuerySpec = {
      query: 'SELECT c.slug FROM c'
    }
    const { resources } = await this.postsContainer.items.query<{ slug: string }>(slugsQuerySpec).fetchAll();
    const slugs = resources.map(r => r.slug);
    return slugs;
  }

  async findAll({
    category,
    userId,
  }: GetPostsDto) {
    this.logger.log('retrieving posts from db');
    this.logger.log(`category: ${category}, userId: ${userId}`);
    const posts = await this.postsRepository.find({
      category,
      userId,
    });
    return this.getPostsWithAuthor(posts);
  }

  async findOne(id: string) {
    this.logger.debug(`Finding post by id - ${id}`);
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.id = @id',
      parameters: [
        {
          name: '@id',
          value: id
        }
      ]
    }
    const { resources } = await this.postsContainer.items.query<Post>(querySpec).fetchAll();
    if (resources.length === 0) {
      throw new NotFoundException('Post not found');
    }
    return resources[0];
  }

  async findBySlug(slug: string) {
    this.logger.log(`Finding post by slug - ${slug}`);
    if(isUUID(slug)){
      return this.findOne(slug);
    }
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.slug = @slug',
      parameters: [
        {
          name: '@slug',
          value: slug
        }
      ]
    }
    const { resources } = await this.postsContainer.items.query<Post>(querySpec).fetchAll();
    if (resources.length === 0) {
      throw new NotFoundException('Post not found');
    }
    const post = resources[0];
    let user = null;
    const userId = post.userId;
    if (userId) {
      user = (await this.usersService.findByIds([userId])).at(0);
    }
    const numberOfCommentsQuery = {
      query: 'SELECT VALUE COUNT(1) FROM c WHERE c.postId = @postId',
      parameters: [
        {
          name: '@postId',
          value: post.id
        }
      ]
    }
    const { resources: counts } = await this.postCommentsContainer.items.query<number[]>(numberOfCommentsQuery).fetchAll();
    const postWithUser = {
      ...FormatCosmosItem.cleanDocument(post),
      user,
      numberOfComments: counts.at(0)
    }
    return postWithUser;
  }

  async toggleActiveState(id: string) {
    const post = await this.findOne(id);
    await this.throwErrorIfUserIsNotOwner(post);
    const newActiveState = !post.isActive;
    if (!newActiveState) {
      await this.checkPostReferences(id);//throws error if post is being referenced
    }
    const updatedPost = {
      ...post,
      isActive: newActiveState
    }
    const { resource } = await this.postsContainer.item(post.id).replace(updatedPost);
    if (newActiveState) {
      this.algoliaService.saveObject(this.transformPostToAlgoliaRecord(updatedPost));
    } else {
      this.algoliaService.deleteObject(id);
    }
    return resource.isActive;
  }

  async remove(id: string) {
    const post = await this.findOne(id);
    await this.throwErrorIfUserIsNotOwner(post);
    await this.checkPostReferences(id);//throws error if post is being referenced
    this.algoliaService.deleteObject(id);
    await this.postsContainer.item(id, post.category).delete();
    //TODO: remove audio from storage if exists
    return null;
  }

  // private async removePostFromCache(id: string) {
  //   const post = await this.findOne(id);
  //   this.cacheManager.del(`postsList-${post.category}`);
  // }

  async updateLikes(id: string, action: LikeAction = LikeAction.INCREMENT) {
    const post = await this.findOne(id);
    if (action === LikeAction.DECREMENT && post.likes === 0) {
      return 0;
    }
    const likes = action === LikeAction.INCREMENT ? post.likes + 1 : post.likes - 1;
    const updatedPost = {
      ...post,
      likes
    }
    this.postsContainer.item(post.id).replace(updatedPost);
    return likes;
  }

  async getHomePosts() {
    const cachedHomePosts = await this.cacheManager.get(HOME_POSTS_KEY);
    if (cachedHomePosts) {
      this.logger.log('retrieving homePosts from cache')
      return cachedHomePosts;
    }
    this.logger.log('retrieving homePosts from db')
    const querySpec = {
      query: 'SELECT * FROM c'
    }
    const { resources } = await this.homePostsContainer.items.query<HomePost>(querySpec).fetchAll();
    const resourcesWithPost = await Promise.all(resources.map(async homePost => {
      const postId = homePost.postId;
      let post = null;
      const querySpec = {
        query: `SELECT ${BASIC_KEYS} FROM c WHERE c.id = @id`,
        parameters: [
          {
            name: '@id',
            value: postId
          }
        ]
      }
      const { resources } = await this.postsContainer.items.query<Post>(querySpec).fetchAll();
      if (resources.length > 0) {
        post = FormatCosmosItem.cleanDocument(resources[0]);
      }
      return {
        ...FormatCosmosItem.cleanDocument(homePost),
        post
      }
    }));
    const groupedHomePosts = resourcesWithPost.reduce((acc, homePost) => {
      if (!acc[homePost.section]) {
        acc[homePost.section] = [];
      }
      acc[homePost.section].push(homePost);
      return acc;
    }, {});
    this.cacheManager.set(HOME_POSTS_KEY, groupedHomePosts, LONG_CACHE_TIME);
    return groupedHomePosts;
  }

  async updateHomePosts(id: string, updateHomePostDto: UpdateHomePostDto) {
    if (!this.usersService.isAdmin()) {
      throw new BadRequestException('You cannot perform this action.');
    }
    const { postId } = updateHomePostDto;
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.id = @id',
      parameters: [
        {
          name: '@id',
          value: id
        }
      ]
    }
    const { resources } = await this.homePostsContainer.items.query<HomePost>(querySpec).fetchAll();
    if (resources.length === 0) {
      throw new NotFoundException('Home post not found');
    }
    const homePost = {
      ...resources[0],
      postId
    }
    const { resource } = await this.homePostsContainer.item(homePost.id).replace(homePost);
    this.cacheManager.del(HOME_POSTS_KEY);
    return FormatCosmosItem.cleanDocument(resource);
  }

  private async checkPostReferences(postId: string) {
    const homePostsQuerySpec = {
      query: 'SELECT * FROM c WHERE c.postId = @postId',
      parameters: [
        {
          name: '@postId',
          value: postId
        }
      ]
    }
    const { resources } = await this.homePostsContainer.items.query<HomePost>(homePostsQuerySpec).fetchAll();
    if (resources.length > 0) {
      throw new BadRequestException('El post está siendo referenciado en la sección de inicio, por favor asigne otro post antes de eliminar.');
    }
  }

  async seed() {
    // const authors = await this.usersService.findAll();
    // const authorIds = authors.map(a => a.id);
    const mocks = scrapedPosts;
    const promises = mocks.map(async (mock) => this.create(mock as CreatePostDto));
    const response = await Promise.all(promises);
    return response;
  }

  async getDistinctTags(search: string) {
    const cachedTags = await this.cacheManager.get(TAGS_KEY);
    if (cachedTags) {
      console.log('retrieving tags from cache')
      return (cachedTags as string[]).filter(t => t.includes(search));
    }
    console.log('retrieving tags from db')
    const querySpec = {
      query: 'SELECT DISTINCT VALUE tag FROM tag IN c.tags'
    }
    const { resources } = await this.postsContainer.items.query<string>(querySpec).fetchAll();
    this.cacheManager.set(TAGS_KEY, resources, LONG_CACHE_TIME);
    return resources.filter(t => t.includes(search));
  }

  async updateSlugs() {
    const querySpec = {
      query: 'SELECT * FROM c'
    }
    const { resources } = await this.postsContainer.items.query<Post>(querySpec).fetchAll();
    const temporaryNewSlugs = [];
    const promises = resources.map(async post => {
      const slug = generateUniqueSlug({ title: post.title, slugs: temporaryNewSlugs });
      const updatedPost = {
        ...post,
        slug
      }
      temporaryNewSlugs.push(slug);
      return this.postsContainer.item(post.id).replace(updatedPost);
    });
    await Promise.all(promises);
    const newPosts = await this.postsContainer.items.query<Post>(querySpec).fetchAll();
    const newSlugs = newPosts.resources.map(p => p.slug);
    const uniqueSlugs = new Set(newSlugs);
    this.cacheManager.del(TAGS_KEY);
    this.cacheManager.del(HOME_POSTS_KEY);
    return {
      totalPosts: newPosts.resources.length,
      uniqueSlugs: uniqueSlugs.size
    }
  }

  private transformPostToAlgoliaRecord(post: Post): PostAlgoliaRecord {
    return {
      objectID: post.id,
      title: post.title,
      slug: post.slug,
      description: post.description,
      imageUrl: post.imageUrl,
      tags: post.tags
    }
  }

  private async throwErrorIfUserIsNotOwner(post: Post) {
    const user = this.usersService.getLoggedUser();
    if (!user) {
      throw new BadRequestException('You cannot perform this action.');
    }
    const role = user.role;
    if (post.userId !== user.id && role !== Role.ADMIN) {
      throw new BadRequestException('You cannot perform this action.');
    }
    return true;
  }

  async getPostsWithAuthor(posts: Partial<Post>[]) {
    const userIds = [];
    posts.forEach(post => {
      if (post.userId) {
        userIds.push(post.userId);
      }
    });
    const users = await this.usersService.findByIds(userIds);
    const postsWithAuthor = posts.map(post => {
      const user = users.find(u => u.id === post.userId);
      return {
        ...post,
        user,
      }
    });
    return postsWithAuthor;
  }

  async getAudio(id: string): Promise<{
    contentAudioUrl: string
  }> {
    this.logger.debug(`Getting audio for post - ${id}`);
    const post = await this.findOne(id);
    const { content, contentAudioUrl } = post;
    if (!content) {
      throw new BadRequestException('Post has no content');
    }
    if (contentAudioUrl) {
      this.logger.debug(`Post already has audio - ${id}`);
      return {
        contentAudioUrl
      };
    }
    const input = getTextFromHtml(content);
    this.logger.debug(`Getting audio for post - ${id} - ${input.length} characters`);
    if (input.length > 4096) {
      throw new BadRequestException('Post content 4096 characteres yet to be implemented');
    }
    this.logger.debug(`Getting audio from openai`);
    const buffer = await this.openaiService.getAudioFromText({
      input,
    });
    const { blobUrl } = await this.storageService.uploadBuffer({
      buffer,
      blobName: this.getAudioBlobName(id),
      contentType: 'audio/mpeg'
    });
    post.contentAudioUrl = blobUrl;
    this.postsContainer.item(post.id).replace(post);
    return {
      contentAudioUrl: blobUrl
      // contentAudioUrl: post.contentAudioUrl ?? ''
    };
  }

  private getAudioBlobName(id: string) {
    const masterFolder = process.env.AZURE_STORAGE_FOLDER || null;
    const folder = masterFolder ? `${masterFolder}/post-audios` : 'post-audios';
    return `${folder}/${id}.mp3`;
  }

  ask(id: string, askPostDto: AskPostDto) {
    console.log('AskPostDto', askPostDto);
    const { question } = askPostDto;
    return from(this.findOne(id))
    .pipe(
      switchMap(post => {
        if(!post){
          throw new NotFoundException('Post not found');
        }
        const { content } = post;
        return this.openaiService.askAbout({
          context: getTextFromHtml(content),
          question,
        });
      })
    );
  }
}