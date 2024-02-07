import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostsModule } from './posts/posts.module';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { dbdatasource } from './db/data-source-options';
import { AuthModule } from './auth/auth.module';
import { TagsModule } from './tags/tags.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(dbdatasource),
    PostsModule, 
    UsersModule,
    AuthModule,
    TagsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
