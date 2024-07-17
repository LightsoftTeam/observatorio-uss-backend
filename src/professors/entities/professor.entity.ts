import { CosmosDateTime, CosmosPartitionKey } from "@nestjs/azure-database";
import { DocumentType } from "src/common/types/document-type.enum";

@CosmosPartitionKey('id')
export class Professor {
    id?: string;
    name: string;
    email: string;
    documentType: DocumentType;
    documentNumber: string;
    schoolId: string;
    @CosmosDateTime() createdAt: Date;
}
