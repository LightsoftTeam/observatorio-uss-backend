import { CosmosDateTime, CosmosPartitionKey } from "@nestjs/azure-database";

export enum Tag{
    CREDENTIALS = 'credentials',
}

@CosmosPartitionKey('tag')
export class AppConfiguration {
    id?: string;
    tag: Tag;
    key: string;
    value: string;
    updatedBy?: string;
    @CosmosDateTime() createdAt: Date;
    @CosmosDateTime() updatedAt?: Date;
}