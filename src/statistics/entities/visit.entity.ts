import { CosmosDateTime, CosmosPartitionKey } from "@nestjs/azure-database";

export enum VisitType{
    WEB = 'web',
}

@CosmosPartitionKey('type')
export class Visit {
    id?: string;
    type: string;
    count: number;
    @CosmosDateTime() createdAt: Date;
    @CosmosDateTime() updatedAt: Date;
}