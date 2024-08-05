import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Container } from '@azure/cosmos';
import { UsersService } from 'src/users/users.service';
import { InjectModel } from '@nestjs/azure-database';
import { ApplicationLoggerService } from 'src/common/services/application-logger.service';
import { PostComment } from '../entities/post-comment.entity';
import { PostsRepository } from '../repositories/post.repository';
import { CreatePostCommentDto } from '../dto/create-post-comment.dto';
import { FormatCosmosItem } from 'src/common/helpers/format-cosmos-item.helper';
import { User } from 'src/users/entities/user.entity';
import { children } from 'cheerio/lib/api/traversing';
import { APP_ERRORS, ERROR_CODES } from 'src/common/constants/errors.constants';

@Injectable()
export class PostCommentsService {
    constructor(
        @InjectModel(PostComment)
        private readonly postCommentsContainer: Container,
        private readonly usersService: UsersService,
        private readonly logger: ApplicationLoggerService,
        private readonly postsRepository: PostsRepository,
    ) {
        this.logger.setContext(PostCommentsService.name);
    }

    async findByPostId(postId: string) {
        const loggedUser = this.usersService.getLoggedUser();
        this.logger.log(`Finding post comments by post id: ${postId}`);
        const querySpec = {
            query: 'SELECT * FROM c WHERE c.postId = @postId AND NOT IS_DEFINED(c.deletedAt)',
            parameters: [{ name: '@postId', value: postId }],
        }
        const { resources } = await this.postCommentsContainer.items.query<PostComment>(querySpec).fetchAll();
        const commentsMap = resources.reduce((map, comment) => {
            map[comment.id] = {
                ...comment,
                children: [],
            };
            return map;
        }, {});

        resources.forEach(comment => {
            if (comment.parentId) {
                if (commentsMap[comment.parentId]) {
                    commentsMap[comment.parentId].children.push(commentsMap[comment.id]);
                }
            }
        });

        console.log(commentsMap);

        const users = await this.usersService.getByIds(resources.map(comment => comment.userId));
        return (Object.values(commentsMap) as PostComment[])
            .filter(comment => !comment.parentId)
            .map(comment => this.fill({ comment, users, loggedUser }));
    }

    async create(postId: string, createPostCommentDto: CreatePostCommentDto) {
        this.logger.log(`Creating post comment: ${JSON.stringify(createPostCommentDto)}`);
        const { parentId } = createPostCommentDto;
        const [post, parent] = await Promise.all([
            this.postsRepository.getById(postId),
            parentId ? this.getById(parentId, postId) : Promise.resolve(null),
        ]);
        if (!post) {
            throw new NotFoundException('Post not found');
        }
        if (parentId) {
            if (!parent) {
                throw new NotFoundException('Parent comment not found');
            }
            if (parent.parentId) {
                throw new BadRequestException(APP_ERRORS[ERROR_CODES.NESTED_COMMENT_NOT_ALLOWED]);
            }
        }
        const postComment: PostComment = {
            ...createPostCommentDto,
            postId,
            userId: this.usersService.getLoggedUser().id,
            likes: [],
            createdAt: new Date(),
        };
        const { resource } = await this.postCommentsContainer.items.create<PostComment>(postComment);
        return this.fill({ comment: resource, users: [], loggedUser: this.usersService.getLoggedUser() });
    }

    async updateLikes({ postId, postCommentId }: { postId: string, postCommentId: string }) {
        this.logger.log(`Updating likes of post comment: ${postCommentId} of the post ${postId}`);
        const postComment = await this.getById(postCommentId, postId);
        if (!postComment) {
            throw new NotFoundException('Post comment not found');
        }
        const user = this.usersService.getLoggedUser();
        const alreadyLiked = postComment.likes.some(like => like.userId === user.id);
        if (alreadyLiked) {
            postComment.likes = postComment.likes.filter(like => like.userId !== user.id);
        } else {
            postComment.likes.push({ userId: user.id, createdAt: new Date() });
        }
        this.postCommentsContainer.item(postCommentId, postComment.postId).replace(postComment);
        return {
            iLikedIt: !alreadyLiked,
            likes: postComment.likes.length,
        };
    }

    async remove(id: string, postId: string) {
        this.logger.log(`Removing post comment: ${id}`);
        const postComment = await this.getById(id, postId);
        if (!postComment) {
            throw new NotFoundException('Post comment not found');
        }
        const updatedPostComment = {
            ...postComment,
            deletedAt: new Date(),
        };
        this.postCommentsContainer.item(id, postComment.postId).replace(updatedPostComment);
        return null;
    }

    async getById(id: string, postId: string) {
        try {
            this.logger.log(`Getting post comment by id: ${id}`);
            const { resource } = await this.postCommentsContainer.item(id, postId).read<PostComment>();
            return resource;
        } catch (error) {
            return null;
        }
    }

    fill({ comment, users, loggedUser }: { comment: PostComment, users: Partial<User>[], loggedUser: Partial<User> }) {
        const user = users.find(user => user.id === comment.userId);
        return {
            ...FormatCosmosItem.cleanDocument(comment, ['likes']),
            children: comment.children.map(child => this.fill({ comment: child, users, loggedUser })),
            user: user ? FormatCosmosItem.cleanDocument(user, ['password']) : null,
            iLikedIt: comment.likes.some(like => like.userId === loggedUser.id),
            numberOfLikes: comment.likes.length,
        };
    }
}