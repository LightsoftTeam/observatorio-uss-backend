import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostsModule } from './posts/posts.module';
import { UsersModule } from './users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AzureCosmosDbModule } from '@nestjs/azure-database';
import { CommonModule } from './common/common.module';
import { StorageModule } from './storage/storage.module';
import { AuthoritiesModule } from './authorities/authorities.module';
import { TagsModule } from './tags/tags.module';
import { StatisticsModule } from './statistics/statistics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AzureCosmosDbModule.forRootAsync({
      // imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        dbName: configService.get('DB_NAME'),
        endpoint: configService.get('DB_ENDPOINT'),
        key: configService.get('DB_KEY'),
        retryAttempts: 1,
      }),
      inject: [ConfigService],
    }),
    PostsModule,
    UsersModule,
    AuthModule,
    CommonModule,
    StorageModule,
    AuthoritiesModule,
    TagsModule,
    StatisticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
