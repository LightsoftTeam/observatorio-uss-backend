import { InjectModel } from "@nestjs/azure-database";
import { SqlQuerySpec } from "@azure/cosmos";
import { Inject, Injectable, forwardRef } from "@nestjs/common";
import { Container } from "@azure/cosmos";
import { ApprovalStatus, Post } from "../../posts/entities/post.entity";
import { ApplicationLoggerService } from "src/common/services/application-logger.service";
import { BASIC_KEYS } from "../../posts/posts.service";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { UsersRepository } from "./users.repository";

const TAGS_KEY = 'tags';
const LONG_CACHE_TIME = 1000 * 60 * 60 * 3;//3 hours

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
        private logger: ApplicationLoggerService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        private readonly usersRepository: UsersRepository,
    ) { }

    async find({
        category,
        approvalStatuses = [ApprovalStatus.APPROVED],
        userId,
    }: PostFilters) {
        const approvedIsIncluded = approvalStatuses.includes(ApprovalStatus.APPROVED);
        const querySpec: SqlQuerySpec = {
            query: `
                SELECT ${BASIC_KEYS} FROM c
                WHERE c.isActive = true AND ${approvedIsIncluded ? '(' : ''}ARRAY_CONTAINS(@approvalStatuses, c.approvalStatus)
            `,
            parameters: [{
                name: '@approvalStatuses',
                value: approvalStatuses
            }]
        }
        if (approvedIsIncluded) {
            querySpec.query += 'OR NOT IS_DEFINED(c.approvalStatus))';
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
        const { resources: posts } = await this.postsContainer.items.query<Post>(querySpec).fetchAll();
        const users = await this.usersRepository.findByIds(posts.map(p => p.userId));
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

    async deleteTagsCache() {
        await this.cacheManager.del(TAGS_KEY);
    }
}