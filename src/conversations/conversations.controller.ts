import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseGuards, Sse, Res } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { CreateMessageDto } from './dto/create-message.dto';
import { ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  // @UseGuards(AuthGuard)
  // @Post()
  // // create(@Body() createConversationDto: CreateConversationDto) {
  // //   return this.conversationsService.create(createConversationDto);
  // // }
  // streamData(@Body() body: CreateConversationDto, @Res() res: Response): void {
  //   // Configurar los encabezados para SSE
  //   res.setHeader('Content-Type', 'text/event-stream');
  //   res.setHeader('Cache-Control', 'no-cache');
  //   res.setHeader('Connection', 'keep-alive');
  //   res.flushHeaders();  // Enviar los encabezados inmediatamente

  //   // Simular la emisión de varios valores con un Observable (por ejemplo, emite 5 valores)
  //   const observable$ = this.conversationsService.create(body);

  //   // Suscribir el Observable para enviar los datos a través de SSE
  //   const subscription = observable$.subscribe({
  //     next: (data) => {
  //       console.log({data});
  //       return res.write("Hola");
  //     },  // Enviar cada valor emitido al cliente
  //     error: (err) => {
  //       res.write(`data: ${JSON.stringify({ error: 'Error en el stream' })}\n\n`);
  //       res.end();  // Terminar la conexión si ocurre un error
  //     },
  //     complete: () => {
  //       res.end();  // Cerrar la conexión cuando el Observable haya emitido todos los valores
  //     }
  //   });

  //   // Finalizar la conexión SSE si el cliente cierra la conexión
  //   res.on('close', () => {
  //     subscription.unsubscribe();  // Cancelar la suscripción si el cliente se desconecta
  //     res.end();
  //   });
  // }

  @UseGuards(AuthGuard)
  @Get()
  findAll() {
    return this.conversationsService.findAll();
  }

  @Get(':id/messages')
  findOne(@Param('id') id: string) {
    return this.conversationsService.getMessages(id);
  }

  @UseGuards(AuthGuard)
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
