import { CosmosDateTime, CosmosPartitionKey } from "@nestjs/azure-database";

@CosmosPartitionKey('id')
export class School {
    id?: string;
    name: string;
    @CosmosDateTime() createdAt: Date;
}
