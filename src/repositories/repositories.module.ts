import { AzureCosmosDbModule } from '@nestjs/azure-database';
import { Global, Module } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { UsersRepository } from './services/users.repository';
import { SchoolsRepository } from './services/schools.repository';
import { School } from 'src/schools/entities/school.entity';
import { Training } from 'src/training/entities/training.entity';

@Global()
@Module({
    imports: [
        AzureCosmosDbModule.forFeature([
            { dto: User },
            { dto: School },
            { dto: Training },
        ]),
    ],
    providers: [
        UsersRepository, 
        SchoolsRepository
    ],
    exports: [
        UsersRepository, 
        SchoolsRepository
    ],
})
export class RepositoriesModule { }
