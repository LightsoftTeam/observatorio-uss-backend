import { Injectable, NotFoundException } from '@nestjs/common';
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

const BASIC_KEYS = [
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

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post)
    private readonly postsContainer: Container,
    private readonly usersService: UsersService
  ){}

  async create(createPostDto: CreatePostDto) {
    const { title, category, content, imageUrl, videoUrl, podcastUrl, description, attachments, imageDescription, tags, userId } = createPostDto;
    const slugsQuerySpec = {
      query: 'SELECT c.slug FROM c'
    }
    const { resources } = await this.postsContainer.items.query<{slug: string}>(slugsQuerySpec).fetchAll();
    const slugs = resources.map(r => r.slug);
    const slug = await generateUniquePostSlug({title, slugs});
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
      tags,
      userId,
      createdAt: new Date(),
      isActive: true,
      likes: 0
    }
    const { resource } = await this.postsContainer.items.create<Post>(post);
    return FormatCosmosItem.cleanDocument(resource, ['content']);
  }

  async update(id: string, updatePostDto: UpdatePostDto) {
    const post = await this.findOne(id);
    const updatedPost = {
      ...post,
      ...updatePostDto
    }
    const { resource } = await this.postsContainer.item(post.id).replace(updatedPost);
    return FormatCosmosItem.cleanDocument(resource, ['content']);
  }

  async findAll({
    category
  }: GetPostsDto) {
    const querySpec = {
      query: `SELECT ${BASIC_KEYS.map(f => `c.${f}`).join(', ')} FROM c WHERE c.category = @category`,
      parameters: [
        {
          name: '@category',
          value: category
        }
      ]
    }
    const { resources } = await this.postsContainer.items.query<Post>(querySpec).fetchAll();
    return resources;
  }

  async find() {
    return [];
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
    if(resources.length === 0){
      throw new NotFoundException('Post not found');
    }
    return FormatCosmosItem.cleanDocument(resources[0]);
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
    if(resources.length === 0){
      throw new NotFoundException('Post not found');
    }
    return FormatCosmosItem.cleanDocument(resources[0]);
  }

  destroy(id: string) {
    return this.postsContainer.item(id).delete();
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

  remove(id: number) {
    return `This action removes a #${id} post`;
  }

  async seed(){
    // const authors = await this.usersService.findAll();
    // const authorIds = authors.map(a => a.id);
    // const mocks = await postsSeeder({
    //   authorIds
    // });
    // await Promise.all(mocks.map(mock => this.postsContainer.items.create<Post>(mock)));
    // return mocks;
    const querySpec = {
      query: 'SELECT * FROM c'
    }
    const { resources } = await this.postsContainer.items.query<Post>(querySpec).fetchAll();
    const promises = resources.map(async post => {
      const updatedPost = {
        ...post,
        isActive: true
      }
      this.postsContainer.item(post.id).replace(updatedPost);
    });
    await Promise.all(promises);
    return 1;
  }
}
