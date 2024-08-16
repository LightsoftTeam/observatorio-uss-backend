import { CosmosDateTime, CosmosPartitionKey } from "@nestjs/azure-database";
import { children } from 'cheerio/lib/api/traversing';
import { User } from "src/users/entities/user.entity";

export class Like{
    userId: string;
    @CosmosDateTime() createdAt: Date;
}

@CosmosPartitionKey('postId')
export class PostComment {
    id?: string;
    body: string;
    likes: Like[];
    userId: string;
    parentId?: string;
    children?: Partial<PostComment>[];
    user?: Partial<User>;
    iLikedIt?: boolean;
    numberOfLikes?: number;
    postId: string;
    @CosmosDateTime() createdAt: Date;
    @CosmosDateTime() updatedAt?: Date;
    @CosmosDateTime() deletedAt?: Date;
}
