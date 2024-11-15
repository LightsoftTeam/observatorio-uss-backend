import { Injectable } from '@nestjs/common';
import type { Container } from '@azure/cosmos';
import { UsersService } from 'src/users/users.service';
import { InjectModel } from '@nestjs/azure-database';
import { ApplicationLoggerService } from 'src/common/services/application-logger.service';
import { PostsRepository } from '../repositories/post.repository';
import { FormatCosmosItem } from 'src/common/helpers/format-cosmos-item.helper';
import { ApprovalStatus, Post } from '../entities/post.entity';
import { PostsService } from '../posts.service';
import { GetPostRequestsDto } from '../dto/get-post-requests.dto';
import { UpdatePostRequestDto, NewDataDto } from '../dto/update-post-request.dto';
import { MailService } from 'src/common/services/mail.service';
import { v4 as uuidv4 } from 'uuid';
import { generateUniqueSlug } from '../helpers/generate-slug.helper';
import { calculateReadTime } from '../helpers/calculate-read-time.helper';

@Injectable()
export class PostRequestsService {
    constructor(
        private readonly usersService: UsersService,
        private readonly logger: ApplicationLoggerService,
        private readonly postsRepository: PostsRepository,
        private readonly postsService: PostsService,
        @InjectModel(Post)
        private readonly postsContainer: Container,
        private readonly mailService: MailService,
    ) {
        this.logger.setContext(PostRequestsService.name);
    }

    async findPostRequests({
        userId
    }: GetPostRequestsDto) {
        try {
            this.usersService.revokeWhenIsNotAdminOrOwner(userId);
            const postRequests = await this.postsRepository.find({
                approvalStatuses: [ApprovalStatus.PENDING, ApprovalStatus.REJECTED],
                userId
            });
            return this.postsService.getPostsWithAuthor(postRequests);
        } catch (error) {
            this.logger.error(error.message);
            throw error;
        }
    }

    async updatePostRequest(id: string, updatePostRequestDto: UpdatePostRequestDto) {
        try {
            this.logger.log(`updating post request - ${id}`);
            this.logger.debug(`updatePostRequestDto - ${JSON.stringify(updatePostRequestDto)}`);
            const { approvalStatus, rejectionReason, newData } = updatePostRequestDto;
            const post = await this.postsService.findOne(id);
            this.usersService.revokeWhenIsNotAdminOrOwner(post.userId);
            const rejectionReasons = post.rejectionReasons ?? [];
            if (approvalStatus === ApprovalStatus.REJECTED && rejectionReason) {
                rejectionReasons.push({
                    id: uuidv4(),
                    reason: rejectionReason,
                    createdAt: new Date()
                });
            }
            let updatedPost: Post = {
                ...post,
                rejectionReasons,
                approvalStatus
            }
            if (newData && approvalStatus === ApprovalStatus.PENDING) {
                const slugs = await this.postsService.getSlugs();
                updatedPost = {
                    ...updatedPost,
                    ...newData,
                }
                if (newData.title) {
                    updatedPost.slug = generateUniqueSlug({ title: newData.title, slugs });
                }
                if (newData.content) {
                    updatedPost.readingTime = calculateReadTime(newData.content);
                }
            }
            const user = await this.usersService.findOne(post.userId);
            this.mailService.sendPostRequestNotification({
                to: user.email,
                post: updatedPost,
                approvalStatus
            });
            if(updatedPost.category === post.category){
                this.logger.debug(`replacing post - ${post.id}`);
                const { resource } = await this.postsContainer.item(post.id, post.category).replace(updatedPost);
                return (await this.postsService.getPostsWithAuthor([FormatCosmosItem.cleanDocument(resource, ['content'])])).at(0);
            }
            this.logger.debug(`deleting post - ${post.id}`);
            await this.postsContainer.item(post.id, post.category).delete();
            const { resource } = await this.postsContainer.items.create(updatedPost);
            return (await this.postsService.getPostsWithAuthor([FormatCosmosItem.cleanDocument(resource, ['content'])])).at(0);
        } catch (error) {
            this.logger.error(error.message);
            throw error;
        }
    }
}