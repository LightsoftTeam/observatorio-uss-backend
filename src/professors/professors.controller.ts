import { Controller, Get, Post, Body, Param, Delete, Put, HttpCode, UseGuards } from '@nestjs/common';
import { ProfessorsService } from './professors.service';
import { CreateProfessorDto } from './dto/create-professor.dto';
import { UpdateProfessorDto } from './dto/update-professor.dto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { DocumentType, Professor } from './entities/professor.entity';
import { GuestGuard } from 'src/auth/guards/guest.guard';
import { InvalidVerificationCodeErrorResponseDto } from './dto/invalid-verification-code.dto';

@ApiTags('Professors')
@Controller('professors')
export class ProfessorsController {
  constructor(private readonly professorsService: ProfessorsService) {}

  @Post()
  @UseGuards(GuestGuard)
  @ApiResponse({
    status: 201,
    description: 'The professor has been successfully created.',
    type: Professor
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request.'
  })
  @ApiResponse({
    status: 404,
    description: 'School not found.'
  })
  create(@Body() createProfessorDto: CreateProfessorDto) {
    return this.professorsService.create(createProfessorDto);
  }

  @Get()
  @ApiResponse({
    status: 200,
    description: 'All professors were found',
    type: [Professor]
  })
  findAll() {
    return this.professorsService.findAll();
  }

  @Get(':id')
  @ApiResponse({
    status: 200,
    description: 'A professor was found',
    type: Professor
  })
  @ApiResponse({
    status: 404,
    description: 'Professor not found',
  })
  findOne(@Param('id') id: string) {
    return this.professorsService.findOne(id);
  }

  @Put(':id')
  @ApiResponse({
    status: 200,
    description: 'The professor has been successfully updated.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request.'
  })
  @ApiResponse({
    status: 404,
    description: 'Professor not found.'
  })
  update(@Param('id') id: string, @Body() updateProfessorDto: UpdateProfessorDto) {
    return this.professorsService.update(id, updateProfessorDto);
  }

  @HttpCode(204)
  @Delete(':id')
  @ApiResponse({
    status: 204,
    description: 'The professor has been successfully deleted.',
  })
  @ApiResponse({
    status: 404,
    description: 'Professor not found.'
  })
  remove(@Param('id') id: string) {
    return this.professorsService.remove(id);
  }

  @Get(':documentType/:documentNumber')
  @ApiResponse({
    status: 200,
    description: 'A professor was found',
    type: Professor
  })
  @ApiResponse({
    status: 404,
    description: 'Professor not found',
  })
  findByDocument(@Param('documentType') documentType: DocumentType, @Param('documentNumber') documentNumber: string) {
    return this.professorsService.findByDocument({documentType, documentNumber});
  }

  @Post(`confirm-register/:code`)
  @ApiResponse({
    status: 200,
    description: 'The email has been confirmed and the professor has been saved.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request.',
    type: InvalidVerificationCodeErrorResponseDto
  })
  confirmRegister(@Param('code') code: string) {
    return this.professorsService.confirmRegister(code);
  }
}
