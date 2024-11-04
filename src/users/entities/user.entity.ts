import { CosmosDateTime, CosmosPartitionKey } from '@nestjs/azure-database';
import { Country } from 'src/common/services/countries.service';
import { DocumentType } from "src/common/types/document-type.enum";

export enum Role{
    ADMIN = 'admin',
    AUTHOR = 'author',
    USER = 'user',
    EVENT_MANAGER = 'event_manager',
    PROFESSOR = 'professor',
}

export enum EmploymentType {
    FULL_TIME = 'full_time',
    PART_TIME = 'part_time',
}

@CosmosPartitionKey('id')
export class User {
    id?: string;
    name: string;
    slug: string;
    biography?: string;
    countryCode?: string;
    country?: Country;
    image?: string;
    email: string;
    password: string;
    role: Role;
    isActive: boolean;
    documentType?: DocumentType;
    documentNumber?: string;
    employmentType?: EmploymentType;
    schoolId?: string;
    requestedRole?: Role;
    excludedFromReports?: boolean;
    @CosmosDateTime() createdAt: Date;
    @CosmosDateTime() updatedAt?: Date;
    @CosmosDateTime() deletedAt?: Date;
}