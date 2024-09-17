import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { InjectModel } from '@nestjs/azure-database';
import { Conversation } from './entities/conversation.entity';
import { Container } from '@azure/cosmos';
import { AuthorType, Message } from './entities/message.entity';
import { query } from 'express';
import { UsersService } from 'src/users/users.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class ConversationsService {

  constructor(
    @InjectModel(Conversation)
    private readonly conversationsContainer: Container,
    @InjectModel(Message)
    private readonly messagesContainer: Container,
    private readonly usersService: UsersService,
  ) { }

  async create(_: CreateConversationDto) {
    const conversation: Conversation = {
      userId: this.usersService.getLoggedUser().id,
      createdAt: new Date(),
    }
    const { resource: createdConversation } = await this.conversationsContainer.items.create(conversation);
    return createdConversation;
  }

  async findAll() {
    const { id } = this.usersService.getLoggedUser();
    const querySpec = {
      query: 'SELECT * FROM c where NOT IS_DEFINED(c.deletedAt) AND c.userId = @userId',
      parameters: [
        {
          name: '@userId',
          value: id,
        },
      ],
    }
    const { resources } = await this.conversationsContainer.items.query<Conversation>(querySpec).fetchAll();
    return resources;
  }

  async getById(id: string): Promise<Conversation | null>{
    const querySpec = {
      query: 'SELECT * FROM c where c.id = @id',
      parameters: [
        {
          name: '@id',
          value: id,
        },
      ],
    }
    const { resources } = await this.conversationsContainer.items.query(querySpec).fetchAll();
    return resources.at(0) ?? null;
  }

  update(id: number, updateConversationDto: UpdateConversationDto) {
    return `This action updates a #${id} conversation`;
  }

  async remove(id: string) {
    const conversation = await this.getById(id);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    const updatedConversation = {
      ...conversation,
      deletedAt: new Date(),
    }
    await this.conversationsContainer.item(id, conversation.userId).replace(updatedConversation);
    return;
  }

  async getMessages(conversationId: string) {
    const querySpec = {
      query: 'SELECT * FROM c where c.conversationId = @conversationId',
      parameters: [
        {
          name: '@conversationId',
          value: conversationId,
        },
      ],
    }
    const { resources } = await this.messagesContainer.items.query<Message>(querySpec).fetchAll();
    return resources;
  }

  async createMessage(conversationId: string, createMessageDto: CreateMessageDto) {
    const { body } = createMessageDto;
    const conversation = await this.getById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    const messages = await this.getMessages(conversationId);
    const isFirstMessage = messages.length === 0;
    const message: Message = {
      conversationId,
      body,
      authorType: AuthorType.USER,
      createdAt: new Date(),
    }
    if(isFirstMessage){
      const slice = body.slice(0, 20);
      const title = slice.charAt(0).toUpperCase() + slice.slice(1);
      conversation.title = title.length > 20 ? title.slice(0, 20) + '...' : title;
    }
    conversation.lastMessageAt = message.createdAt;
    conversation.updatedAt = message.createdAt;
    await this.conversationsContainer.item(conversationId, conversation.userId).replace(conversation);
    return this.storeMessage(message);
  }

  async storeMessage(message: Message) {
    const { resource: createdMessage } = await this.messagesContainer.items.create(message);
    return createdMessage;
  }
}
