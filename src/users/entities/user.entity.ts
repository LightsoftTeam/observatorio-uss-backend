import { CosmosDateTime, CosmosPartitionKey } from '@nestjs/azure-database';

export enum Role{
    ADMIN = 'admin',
    AUTHOR = 'author',
}
@CosmosPartitionKey('id')
export class User {
    id?: string;
    name: string;
    image: string;
    email: string;
    password: string;
    role: Role;
    isActive: boolean;
    @CosmosDateTime() createdAt: Date;
}