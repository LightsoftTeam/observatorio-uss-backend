import { CosmosDateTime, CosmosPartitionKey } from "@nestjs/azure-database";
import { ChatCompletionRole } from "openai/resources";

@CosmosPartitionKey('conversationId')
export class Message {
    id?: string;
    conversationId: string;
    role: ChatCompletionRole;
    body: string;
    @CosmosDateTime() createdAt: Date;
    @CosmosDateTime() updatedAt?: Date;
    @CosmosDateTime() deletedAt?: Date;
}
