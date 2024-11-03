import { AzureCosmosDbModule } from '@nestjs/azure-database';
import { Global, Module } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { UsersRepository } from './services/users.repository';
import { SchoolsRepository } from './services/schools.repository';
import { School } from 'src/schools/entities/school.entity';
import { Training } from 'src/training/entities/training.entity';
import { PostsRepository } from './services/post.repository';
import { Post } from 'src/posts/entities/post.entity';

@Global()
@Module({
    imports: [
        AzureCosmosDbModule.forFeature([
            { dto: User },
            { dto: School },
            { dto: Training },
            { dto: Post },
        ]),
    ],
    providers: [
        UsersRepository, 
        SchoolsRepository,
        PostsRepository,
    ],
    exports: [
        UsersRepository, 
        SchoolsRepository,
        PostsRepository,
    ],
})
export class RepositoriesModule { }
