import { CosmosDateTime, CosmosPartitionKey } from '@nestjs/azure-database';
import { DocumentType } from 'src/common/types/document-type.enum';

@CosmosPartitionKey('id')
export class Guest {
    id?: string;
    name: string;
    image: string;
    email: string;
    documentType: DocumentType;
    documentNumber: string;
    isApproved: boolean;
    @CosmosDateTime() createdAt: Date;
}
