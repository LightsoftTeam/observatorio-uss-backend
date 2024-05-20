import { CosmosDateTime, CosmosPartitionKey } from "@nestjs/azure-database";

@CosmosPartitionKey('id')
export class Authority {
    id?: string;
    name: string;
    description?: string;
    imageUrl?: string;
    position?: string;
    hierarchy: number;
    socialMedia: string[];
    @CosmosDateTime() createdAt: Date;
}
