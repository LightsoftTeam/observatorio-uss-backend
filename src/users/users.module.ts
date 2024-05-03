import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { AzureCosmosDbModule } from '@nestjs/azure-database';
import { CacheModule } from '@nestjs/cache-manager';
import { CommonModule } from 'src/common/common.module';
import { PostsModule } from 'src/posts/posts.module';

@Module({
  imports: [
    // PostsModule,
    AzureCosmosDbModule.forFeature([
      {dto: User}
    ]),
    CacheModule.register(),
    CommonModule,
    forwardRef(() => PostsModule)
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, AzureCosmosDbModule, CacheModule],
})
export class UsersModule {}
