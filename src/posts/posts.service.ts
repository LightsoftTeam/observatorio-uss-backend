import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Container } from '@azure/cosmos';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { GetPostsDto } from './dto/get-posts.dto';
import { Post } from './entities/post.entity';
import { generateUniquePostSlug } from './helpers/generate-slug.helper';
import { calculateReadTime } from './helpers/calculate-read-time.helper';
import { UsersService } from 'src/users/users.service';
import { InjectModel } from '@nestjs/azure-database';
import { FormatCosmosItem } from 'src/common/helpers/format-cosmos-item.helper';
import { LikeAction } from './types/like-action.type';
import { HomePost } from './entities/home-post.entity';
import { UpdateHomePostDto } from './dto/update-home-post.dto';
import { homePostsSeeder } from 'src/db/seeders/home-post.seeder';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { AlgoliaService, PostAlgoliaRecord } from 'src/common/services/algolia.service';

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
  'tags',
  'createdAt'
]

const BASIC_KEYS = BASIC_KEYS_LIST.map(f => `c.${f}`).join(', ')
const HOME_POSTS_KEY = 'homePosts';
const POSTS_LIST_KEY = 'postsList';
const TAGS_KEY = 'tags';
const LONG_CACHE_TIME = 1000 * 60 * 60 * 5;//5 hours

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post)
    private readonly postsContainer: Container,
    @InjectModel(HomePost)
    private readonly homePostsContainer: Container,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly usersService: UsersService,
    private readonly algoliaService: AlgoliaService
  ) { }

  async create(createPostDto: CreatePostDto) {
    const { title, category, content, imageUrl, videoUrl, podcastUrl, description, attachments, imageDescription, tags, userId } = createPostDto;
    const slugsQuerySpec = {
      query: 'SELECT c.slug FROM c'
    }
    const { resources } = await this.postsContainer.items.query<{ slug: string }>(slugsQuerySpec).fetchAll();
    const slugs = resources.map(r => r.slug);
    const slug = await generateUniquePostSlug({ title, slugs });
    const readingTime = content ? calculateReadTime(content) : null;
    await this.usersService.findOne(userId);//throws error if user not found

    const post = {
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
      likes: 0
    }
    const { resource } = await this.postsContainer.items.create<Post>(post);
    this.algoliaService.saveObject(this.transformPostToAlgoliaRecord(post));
    this.cacheManager.del(POSTS_LIST_KEY);
    this.cacheManager.del(TAGS_KEY);
    return FormatCosmosItem.cleanDocument(resource, ['content']);
  }

  async update(id: string, updatePostDto: UpdatePostDto) {
    const post = await this.findOne(id);
    if(updatePostDto.tags?.length > 0) {
      updatePostDto.tags = updatePostDto.tags.map(t => t.trim().toLowerCase());
    }
    const updatedPost: Post = {
      ...post,
      ...updatePostDto
    }
    const { resource } = await this.postsContainer.item(post.id).replace(updatedPost);
    this.algoliaService.updateObject(this.transformPostToAlgoliaRecord(updatedPost));
    this.cacheManager.del(POSTS_LIST_KEY);
    this.cacheManager.del(HOME_POSTS_KEY);
    this.cacheManager.del(TAGS_KEY);
    return FormatCosmosItem.cleanDocument(resource, ['content']);
  }

  async findAll({
    category
  }: GetPostsDto) {
    const cachedPosts = await this.cacheManager.get(POSTS_LIST_KEY);
    if (cachedPosts) {
      if(category){
        console.log('retrieving posts from cache with category')
        return (cachedPosts as Post[]).filter(p => p.category === category);
      }
      console.log('retrieving posts from cache without category')
      return cachedPosts;
    }
    console.log('retrieving posts from db')
    const querySpec = {
      query: `SELECT ${BASIC_KEYS} FROM c`,
      parameters: []
    }
    // if (category) {
    //   querySpec.query += ' WHERE c.category = @category';
    //   querySpec.parameters = [
    //     {
    //       name: '@category',
    //       value: category
    //     }
    //   ]
    // }
    querySpec.query += ' ORDER BY c.createdAt DESC';
    const { resources } = await this.postsContainer.items.query<Post>(querySpec).fetchAll();
    // const userIds = resources.map(r => r.userId);
    const users = await this.usersService.findAll();
    const postsWithUser = resources.map(post => {
      const user = users.find(u => u.id === post.userId);
      return {
        ...post,
        user
      }
    });
    this.cacheManager.set(POSTS_LIST_KEY, postsWithUser, LONG_CACHE_TIME);//5 hours
    return category ? postsWithUser.filter(p => p.category === category) : postsWithUser;
  }

  async findOne(id: string) {
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
    const users = await this.usersService.findByIds([resources[0].userId]);
    const postWithUser = {
      ...FormatCosmosItem.cleanDocument(resources[0]),
      user: users[0]
    }
    return postWithUser;
  }

  async toggleActiveState(id: string) {
    const post = await this.findOne(id);
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
    this.cacheManager.del(`postsList-${resource.category}`);
    return resource.isActive;
  }

  async remove(id: string) {
    await this.checkPostReferences(id);//throws error if post is being referenced
    this.algoliaService.deleteObject(id);
    this.removePostFromCache(id);
    console.log(id)
    const post = await this.findOne(id);
    await this.postsContainer.item(id, post.category).delete();
    return null;
  }

  private async removePostFromCache(id: string) {
    const post = await this.findOne(id);
    this.cacheManager.del(`postsList-${post.category}`);
  }

  async updateLikes(id: string, action: LikeAction = LikeAction.INCREMENT) {
    const post = await this.findOne(id);
    const likes = action === LikeAction.INCREMENT ? post.likes + 1 : post.likes - 1;
    const updatedPost = {
      ...post,
      likes
    }
    await this.postsContainer.item(post.id).replace(updatedPost);
    return likes;
  }

  async getHomePosts() {
    const cachedHomePosts = await this.cacheManager.get(HOME_POSTS_KEY);
    if (cachedHomePosts) {
      console.log('retrieving homePosts from cache')
      return cachedHomePosts;
    }
    console.log('retrieving homePosts from db')
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
    this.cacheManager.set(HOME_POSTS_KEY, groupedHomePosts, LONG_CACHE_TIME);//5 hours
    return groupedHomePosts;
  }

  async updateHomePosts(id: string, updateHomePostDto: UpdateHomePostDto) {
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
    //delete cache
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
    // const mocks = await postsSeeder({
    //   authorIds
    // });
    // await Promise.all(mocks.map(mock => this.postsContainer.items.create<Post>(mock)));
    // return mocks;
    // const querySpec = {
    //   query: 'SELECT * FROM c'
    // }
    // const { resources } = await this.postsContainer.items.query<Post>(querySpec).fetchAll();
    // const promises = resources.map(async post => {
    //   const updatedPost = {
    //     ...post,
    //     isActive: true
    //   }
    //   this.postsContainer.item(post.id).replace(updatedPost);
    // });
    // await Promise.all(promises);
    // return 1;
  }

  async getDistinctTags(search: string) {
    const cachedTags = await this.cacheManager.get(TAGS_KEY);
    if(cachedTags) {
      console.log('retrieving tags from cache')
      return (cachedTags as string[]).filter(t => t.includes(search));
    }
    console.log('retrieving tags from db')
    const querySpec = {
      query: 'SELECT DISTINCT VALUE tag FROM tag IN c.tags'
    }
    const { resources } = await this.postsContainer.items.query<string>(querySpec).fetchAll();
    this.cacheManager.set(TAGS_KEY, resources, LONG_CACHE_TIME);//5 hours
    return resources.filter(t => t.includes(search));
  }

  async homePostsSeed() {
    const homePostsMocks = homePostsSeeder();
    Promise.all(homePostsMocks.map(mock => this.homePostsContainer.items.create<HomePost>(mock)));
    return homePostsMocks;
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
}
