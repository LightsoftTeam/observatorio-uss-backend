import { InjectModel } from "@nestjs/azure-database";
import { SqlQuerySpec } from "@azure/cosmos";
import { Inject, Injectable, forwardRef } from "@nestjs/common";
import { Container } from "@azure/cosmos";
import { Post } from "../entities/post.entity";
import { UsersService } from "src/users/users.service";

export interface PostFilters {
    category?: string;
    isPendingApproval?: boolean;
    userId?: string;
}

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
    'createdAt'
];
export const BASIC_KEYS = BASIC_KEYS_LIST.map(f => `c.${f}`).join(', ');

@Injectable()
export class PostsRepository {
    constructor(
        @InjectModel(Post)
        private readonly postsContainer: Container,
        @Inject(forwardRef(() => UsersService))
        private readonly usersService: UsersService,
    ) { }

    async find({
        category,
        isPendingApproval = false,
        userId,
    }: PostFilters) {
        const querySpec: SqlQuerySpec = {
            query: `
                SELECT ${BASIC_KEYS} FROM c
                WHERE c.isActive = true
            `,
            parameters: [{
                name: '@isPendingApproval',
                value: isPendingApproval
            }]
        }
        if(!isPendingApproval){
            //get undefined or true
            querySpec.query += ' AND (c.isPendingApproval = @isPendingApproval OR NOT IS_DEFINED(c.isPendingApproval))';
        }else{
            //get true
            querySpec.query += ' AND c.isPendingApproval = @isPendingApproval';
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
}