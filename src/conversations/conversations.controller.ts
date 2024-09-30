import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { CreateMessageDto } from './dto/create-message.dto';
import { ApiResponse } from '@nestjs/swagger';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  // @UseGuards(AuthGuard)
  @Post()
  create(@Body() createConversationDto: CreateConversationDto) {
    return this.conversationsService.create(createConversationDto);
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll() {
    return this.conversationsService.findAll();
  }

  // @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.conversationsService.findOne(id);
  }

  @Get(':id/messages')
  getMessages(@Param('id') id: string) {
    return this.conversationsService.getMessages(id);
  }

  // @UseGuards(AuthGuard)
  @ApiResponse({ status: 201, description: 'The message has been successfully created.' })
  @ApiResponse({ status: 404, description: 'The conversation was not found.' })
  @Post(':id/messages')
  createMessage(@Param('id') id: string, @Body() createMessageDto: CreateMessageDto) {
    return this.conversationsService.createMessage(id, createMessageDto);
  }

  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.conversationsService.remove(id);
  }
}
