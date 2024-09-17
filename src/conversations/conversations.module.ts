import { Module } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { AzureCosmosDbModule } from '@nestjs/azure-database';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { OpenaiModule } from 'src/openai/openai.module';
import { OpenaiService } from 'src/openai/openai.service';
import { CommonModule } from 'src/common/common.module';

@Module({
  controllers: [ConversationsController],
  providers: [ConversationsService, OpenaiService],
  imports: [
    AzureCosmosDbModule.forFeature([
      {dto: Conversation},
      {dto: Message}
    ]),
    OpenaiModule,
    CommonModule,
  ],
})
export class ConversationsModule {}
