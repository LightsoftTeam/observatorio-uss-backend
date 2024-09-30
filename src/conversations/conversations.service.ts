import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { InjectModel } from '@nestjs/azure-database';
import { Conversation } from './entities/conversation.entity';
import { Container } from '@azure/cosmos';
import { Message } from './entities/message.entity';
import { UsersService } from 'src/users/users.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { v4 as uuidv4 } from 'uuid';
import { FormatCosmosItem } from 'src/common/helpers/format-cosmos-item.helper';
import { ApplicationLoggerService } from 'src/common/services/application-logger.service';

@Injectable()
export class ConversationsService {

  constructor(
    @InjectModel(Conversation)
    private readonly conversationsContainer: Container,
    @InjectModel(Message)
    private readonly messagesContainer: Container,
    private readonly usersService: UsersService,
    private readonly logger: ApplicationLoggerService,
  ) { }

  create(createConversationDto: CreateConversationDto) {
    const { id } = createConversationDto;
    const conversation: Conversation = {
      ...createConversationDto,
      id: id ?? uuidv4(),
    };
    this.conversationsContainer.items.create(conversation);
    return FormatCosmosItem.cleanDocument(conversation);
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
    return resources.map(r => FormatCosmosItem.cleanDocument(r));
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

  async findOne(id: string) {
    const conversation = await this.getById(id);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    return FormatCosmosItem.cleanDocument(conversation);
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
    this.logger.debug(`Creating message ${JSON.stringify(createMessageDto)}`);
    const conversation = await this.getById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    conversation.lastMessageAt = new Date(createMessageDto.createdAt);
    conversation.updatedAt = new Date(createMessageDto.createdAt);
    const message: Message = {
      ...createMessageDto,
      conversationId,
    };
    this.conversationsContainer.item(conversationId, conversation.userId).replace(conversation);
    this.messagesContainer.items.create(message);
    return FormatCosmosItem.cleanDocument(message);
  }
}
