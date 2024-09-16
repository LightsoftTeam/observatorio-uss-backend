import { CosmosDateTime, CosmosPartitionKey } from "@nestjs/azure-database";

export enum AuthorType {
    SYSTEM = 'system',
    USER = 'user',
}

@CosmosPartitionKey('conversationId')
export class Message {
    id?: string;
    conversationId: string;
    authorType: AuthorType;
    body: string;
    @CosmosDateTime() createdAt: Date;
    @CosmosDateTime() updatedAt?: Date;
    @CosmosDateTime() deletedAt?: Date;
}
