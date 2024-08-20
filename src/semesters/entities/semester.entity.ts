import { CosmosDateTime, CosmosPartitionKey } from "@nestjs/azure-database";

@CosmosPartitionKey('id')
export class Semester {
    id?: string;
    name: string;
    @CosmosDateTime() createdAt: Date;
    @CosmosDateTime() updatedAt?: Date;
    @CosmosDateTime() deletedAt?: Date;
}