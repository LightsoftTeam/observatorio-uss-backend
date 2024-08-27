import { Injectable, NotFoundException } from '@nestjs/common';
import type { Container } from '@azure/cosmos';
import { UsersService } from 'src/users/users.service';
import { InjectModel } from '@nestjs/azure-database';
import { ApplicationLoggerService } from 'src/common/services/application-logger.service';
import { PostsRepository } from '../repositories/post.repository';
import { FormatCosmosItem } from 'src/common/helpers/format-cosmos-item.helper';
import { ApprovalStatus, Post } from '../entities/post.entity';
import { PostsService } from '../posts.service';
import { GetPostRequestsDto } from '../dto/get-post-requests.dto';
import { UpdatePostRequestDto } from '../dto/update-post-request.dto';
import { MailService } from 'src/common/services/mail.service';
import { v4 as uuidv4 } from 'uuid';

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
        this.usersService.revokeWhenIsNotAdminOrOwner(userId);
        const postRequests = await this.postsRepository.find({
            approvalStatuses: [ApprovalStatus.PENDING, ApprovalStatus.REJECTED],
            userId
        });
        return this.postsService.getPostsWithAuthor(postRequests);
    }

    async updatePostRequest(id: string, updatePostRequestDto: UpdatePostRequestDto) {
        this.logger.log(`updating post request - ${id}`);
        const { approvalStatus, rejectionReason } = updatePostRequestDto;
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
        const updatedPost: Post = {
            ...post,
            rejectionReasons,
            approvalStatus
        }
        const user = await this.usersService.findOne(post.userId);
        this.mailService.sendPostRequestNotification({
            to: user.email,
            post: updatedPost,
            approvalStatus
        });
        const { resource } = await this.postsContainer.item(post.id).replace(updatedPost);
        return FormatCosmosItem.cleanDocument(resource);
    }
}