import { CosmosDateTime, CosmosPartitionKey } from "@nestjs/azure-database";

@CosmosPartitionKey('id')
export class Competency {
    id?: string;
    name: string;
    @CosmosDateTime() deletedAt?: Date;
    @CosmosDateTime() createdAt: Date;
}
