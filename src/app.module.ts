import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
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
import { TrainingModule } from './training/training.module';
import { ProfessorsModule } from './professors/professors.module';
import { SchoolsModule } from './schools/schools.module';
import { MailService } from './common/services/mail.service';
import { StatisticsModule } from './statistics/statistics.module';
import { CacheModule } from '@nestjs/cache-manager';
import { CompetenciesModule } from './competencies/competencies.module';
import { SemestersModule } from './semesters/semesters.module';
import { ReportsModule } from './reports/reports.module';
import { OpenaiModule } from './openai/openai.module';
import { ConversationsModule } from './conversations/conversations.module';
import { AppConfigurationModule } from './app-configuration/app-configuration.module';

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
    CacheModule.register({
      isGlobal: true,
    }),
    PostsModule,
    UsersModule,
    AuthModule,
    CommonModule,
    StorageModule,
    AuthoritiesModule,
    TagsModule,
    TrainingModule,
    ProfessorsModule,
    SchoolsModule,
    StatisticsModule,
    CompetenciesModule,
    SemestersModule,
    ReportsModule,
    OpenaiModule,
    ConversationsModule,
    EventEmitterModule.forRoot(),
    AppConfigurationModule,
  ],
  controllers: [AppController],
  providers: [AppService, MailService],
})
export class AppModule { }
