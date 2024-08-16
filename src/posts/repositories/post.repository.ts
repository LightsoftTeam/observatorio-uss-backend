import { InjectModel } from "@nestjs/azure-database";
import { SqlQuerySpec } from "@azure/cosmos";
import { Inject, Injectable, forwardRef } from "@nestjs/common";
import { Container } from "@azure/cosmos";
import { ApprovalStatus, Post } from "../entities/post.entity";
import { UsersService } from "src/users/users.service";
import { ApplicationLoggerService } from "src/common/services/application-logger.service";
import { BASIC_KEYS } from "../posts.service";

export interface PostFilters {
    category?: string;
    approvalStatuses?: ApprovalStatus[];
    userId?: string;
}

@Injectable()
export class PostsRepository {
    constructor(
        @InjectModel(Post)
        private readonly postsContainer: Container,
        @Inject(forwardRef(() => UsersService))
        private readonly usersService: UsersService,
        private logger: ApplicationLoggerService,
    ) { }

    async find({
        category,
        approvalStatuses = [ApprovalStatus.APPROVED],
        userId,
    }: PostFilters) {
        const querySpec: SqlQuerySpec = {
            query: `
                SELECT ${BASIC_KEYS} FROM c
                WHERE c.isActive = true AND ARRAY_CONTAINS(@approvalStatuses, c.approvalStatus)
            `,
            parameters: [{
                name: '@approvalStatuses',
                value: approvalStatuses
            }]
        }
        if (approvalStatuses.includes(ApprovalStatus.APPROVED)) {
            querySpec.query += 'OR NOT IS_DEFINED(c.approvalStatus)';
        }
        if (userId) {
            querySpec.query += ' AND c.userId = @userId';
            querySpec.parameters.push({
                name: '@userId',
                value: userId
            });
        }
        if (category) {
            querySpec.query += ' AND c.category = @category';
            querySpec.parameters.push({
                name: '@category',
                value: category
            });
        }
        querySpec.query += ' ORDER BY c.createdAt DESC';
        console.log(querySpec);
        const { resources: posts } = await this.postsContainer.items.query<Post>(querySpec).fetchAll();
        const users = await this.usersService.findByIds(posts.map(p => p.userId));
        let postsWithAuthor = posts.map(post => {
            const user = users.find(u => u.id === post.userId);
            return {
                ...post,
                user,
            }
        });
        return postsWithAuthor;
    }

    async getById(id: string) {
        this.logger.log(`Getting post by id: ${id}`);
        try {
            const querySpec = {
                query: `SELECT * FROM c WHERE c.id = @id`,
                parameters: [{ name: '@id', value: id }]
            };
            const { resources } = await this.postsContainer.items.query<Post>(querySpec).fetchAll();
            this.logger.log(`Post found: ${JSON.stringify(resources.length)}`);
            return resources.at(0) ?? null;
        } catch (error) {
            return null;
        }
    }
}