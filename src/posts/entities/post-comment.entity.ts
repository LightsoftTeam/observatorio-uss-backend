import { CosmosDateTime, CosmosPartitionKey } from "@nestjs/azure-database";
import { children } from 'cheerio/lib/api/traversing';

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
    children?: PostComment[];
    iLikedIt?: boolean;
    numberOfLikes?: number;
    postId: string;
    @CosmosDateTime() createdAt: Date;
    @CosmosDateTime() updatedAt?: Date;
    @CosmosDateTime() deletedAt?: Date;
}
