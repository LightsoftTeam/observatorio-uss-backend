import { CosmosDateTime, CosmosPartitionKey } from '@nestjs/azure-database';

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
    image?: string;
    email: string;
    password: string;
    role: Role;
    isActive: boolean;
    @CosmosDateTime() createdAt: Date;
}