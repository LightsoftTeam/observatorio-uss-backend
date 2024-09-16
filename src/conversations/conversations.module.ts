import { Module } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { AzureCosmosDbModule } from '@nestjs/azure-database';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';

@Module({
  controllers: [ConversationsController],
  providers: [ConversationsService],
  imports: [
    AzureCosmosDbModule.forFeature([
      {dto: Conversation},
      {dto: Message}
    ])
  ],
})
export class ConversationsModule {}
