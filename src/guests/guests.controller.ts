import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { GuestsService } from './guests.service';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { ApiResponse } from '@nestjs/swagger';
import { DocumentType } from 'src/common/types/document-type.enum';
import { CreateGuestBadRequestDto } from './dto/create-guest-bad-request.dto';

@Controller('guests')
export class GuestsController {
  constructor(private readonly guestsService: GuestsService) {}

  @Post()
  @ApiResponse({ status: 201, description: 'The record has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid code', type: CreateGuestBadRequestDto })
  create(@Body() createGuestDto: CreateGuestDto) {
    return this.guestsService.create(createGuestDto);
  }

  @Get()
  findAll() {
    return this.guestsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.guestsService.findOne(id);
  }
  
  @Get('/:documentType/:documentNumber')
  @ApiResponse({ status: 200, description: 'The found record' })
  @ApiResponse({ status: 404, description: 'Guest not found' })
  findByDocument(@Param('documentType') documentType: DocumentType, @Param('documentNumber') documentNumber: string) {
    return this.guestsService.findByDocument({ documentType, documentNumber });
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateGuestDto: UpdateGuestDto) {
    return this.guestsService.update(id, updateGuestDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.guestsService.remove(+id);
  }
}
