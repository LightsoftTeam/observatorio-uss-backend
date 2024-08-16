import { CosmosDateTime, CosmosPartitionKey } from "@nestjs/azure-database";
import { DocumentType } from "src/common/types/document-type.enum";

export enum EmploymentType {
    FULL_TIME = 'full_time',
    PART_TIME = 'part_time',
}
@CosmosPartitionKey('id')
export class Professor {
    id?: string;
    name: string;
    email: string;
    documentType: DocumentType;
    documentNumber: string;
    employmentType: EmploymentType;
    schoolId: string;
    @CosmosDateTime() createdAt: Date;
}