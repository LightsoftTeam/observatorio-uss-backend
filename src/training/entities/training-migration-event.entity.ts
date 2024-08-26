import { CosmosDateTime, CosmosPartitionKey } from "@nestjs/azure-database";

export interface TrainingMigrationTrace{
    isSuccessful: boolean;
    message: string;
}

@CosmosPartitionKey('id')
export class TrainingMigrationEvent {
    id?: string;
    sheetNames?: string[];
    trace: TrainingMigrationTrace[];
    @CosmosDateTime() createdAt: Date;
}
