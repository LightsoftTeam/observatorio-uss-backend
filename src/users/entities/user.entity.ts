import { CosmosDateTime, CosmosPartitionKey } from '@nestjs/azure-database';
import { Country } from 'src/common/services/countries.service';

export enum Role{
    ADMIN = 'admin',
    AUTHOR = 'author',
    USER = 'user'
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
    @CosmosDateTime() createdAt: Date;
}