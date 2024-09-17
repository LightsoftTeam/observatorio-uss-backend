import { CosmosDateTime, CosmosPartitionKey } from "@nestjs/azure-database";

export enum TokenReason {
    PASSWORD_RESET = 'password_reset',
}

@CosmosPartitionKey('userId')
export class UserToken {
    id?: string;
    token: string;
    userId: string;
    reason: TokenReason;
    @CosmosDateTime() createdAt: Date;
    @CosmosDateTime() updatedAt?: Date;
    @CosmosDateTime() expiresAt: Date;
}