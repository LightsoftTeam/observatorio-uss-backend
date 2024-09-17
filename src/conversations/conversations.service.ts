import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { InjectModel } from '@nestjs/azure-database';
import { Conversation } from './entities/conversation.entity';
import { Container } from '@azure/cosmos';
import { Message } from './entities/message.entity';
import { UsersService } from 'src/users/users.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { v4 as uuidv4 } from 'uuid';
import { FormatCosmosItem } from 'src/common/helpers/format-cosmos-item.helper';
import { OpenaiService } from 'src/openai/openai.service';
import { ChatCompletionMessageParam } from 'openai/resources';

@Injectable()
export class ConversationsService {

  constructor(
    @InjectModel(Conversation)
    private readonly conversationsContainer: Container,
    @InjectModel(Message)
    private readonly messagesContainer: Container,
    private readonly usersService: UsersService,
    private readonly openaiService: OpenaiService,
  ) { }

  async create(createConversationDto: CreateConversationDto) {
    const { body } = createConversationDto;
    const slice = body.length > 20 ? body.slice(0, 20) + '...' : body;
    const title = slice.charAt(0).toUpperCase() + slice.slice(1);
    const conversationId = uuidv4();
    const now = new Date();
    const userMessage: Message = {
      conversationId,
      body,
      role: 'user',
      createdAt: now,
    }
    const systemMessage = await this.getSystemMessage({messages: [userMessage], conversationId});
    const conversation: Conversation = {
      id: conversationId,
      title,
      userId: this.usersService.getLoggedUser().id,
      createdAt: now,
      lastMessageAt: systemMessage.createdAt,
    }
    this.conversationsContainer.items.create(conversation);
    this.storeMessage(userMessage);
    this.storeMessage(systemMessage);
    return {
      conversation,
      messages: [
        userMessage, 
        systemMessage,
      ],
    };
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

  async getById(id: string): Promise<Conversation | null> {
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
      query: 'SELECT * FROM c where c.conversationId = @conversationId order by c.createdAt asc',
      parameters: [
        {
          name: '@conversationId',
          value: conversationId,
        },
      ],
    }
    const { resources } = await this.messagesContainer.items.query<Message>(querySpec).fetchAll();
    return resources.map(r => FormatCosmosItem.cleanDocument(r));
  }

  async createMessage(conversationId: string, createMessageDto: CreateMessageDto) {
    const { body } = createMessageDto;
    const conversation = await this.getById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    const messages = await this.getMessages(conversationId);
    const message: Message = {
      conversationId,
      body,
      role: 'user',
      createdAt: new Date(),
    }
    messages.push(message);
    this.storeMessage(message);
    conversation.lastMessageAt = message.createdAt;
    conversation.updatedAt = message.createdAt;
    this.conversationsContainer.item(conversationId, conversation.userId).replace(conversation);
    const systemMessage = await this.getSystemMessage({messages, conversationId});
    this.messagesContainer.items.create(systemMessage);
    return [
      message,
      systemMessage,
    ];
  }

  async storeMessage(message: Message) {
    const { resource: createdMessage } = await this.messagesContainer.items.create(message);
    return FormatCosmosItem.cleanDocument(createdMessage);
  }

  async getSystemMessage({messages, conversationId}: {messages: Partial<Message>[], conversationId: string}) {
    const completionMessages: ChatCompletionMessageParam[] = messages.map(({body, role}) => ({role, content: body} as ChatCompletionMessageParam));
    const { message } = await this.openaiService.getCompletion(completionMessages);
    const { content, role } = message;
    const systemMessage: Message = {
      id: uuidv4(),
      conversationId,
      body: content,
      role,
      createdAt: new Date(),
    }
    return systemMessage;
  }
}
