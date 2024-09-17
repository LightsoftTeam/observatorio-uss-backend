import { CosmosDateTime, CosmosPartitionKey } from "@nestjs/azure-database";

@CosmosPartitionKey('userId')
export class Conversation {
    id?: string;
    title?: string;
    userId: string;
    @CosmosDateTime() lastMessageAt?: Date;
    @CosmosDateTime() createdAt: Date;
    @CosmosDateTime() updatedAt?: Date;
    @CosmosDateTime() deletedAt?: Date;
}
