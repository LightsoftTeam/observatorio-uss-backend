import { Controller, Get, Post, Body, Param, Delete, Put, HttpCode, UseGuards } from '@nestjs/common';
import { AuthoritiesService } from './authorities.service';
import { CreateAuthorityDto } from './dto/create-authority.dto';
import { UpdateAuthorityDto } from './dto/update-authority.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@ApiTags('Authorities')
@Controller('authorities')
export class AuthoritiesController {
  constructor(private readonly authoritiesService: AuthoritiesService) {}

  @ApiOperation({ summary: 'Create an authority' })
  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  @ApiResponse({ status: 201, description: 'The authority has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @Post()
  create(@Body() createAuthorityDto: CreateAuthorityDto) {
    return this.authoritiesService.create(createAuthorityDto);
  }

  @ApiOperation({ summary: 'Get all authorities' })
  @ApiResponse({ status: 200, description: 'Return all authorities.' })
  @Get()
  findAll() {
    return this.authoritiesService.findAll();
  }

  @ApiOperation({ summary: 'Update an authority' })
  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  @ApiResponse({ status: 200, description: 'The authority has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'Authority not found' })
  @Put(':id')
  update(@Param('id') id: string, @Body() updateAuthorityDto: UpdateAuthorityDto) {
    return this.authoritiesService.update(id, updateAuthorityDto);
  }

  @ApiOperation({ summary: 'Delete an authority' })
  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  @ApiResponse({ status: 204, description: 'The authority has been successfully deleted.' })
  @HttpCode(204)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.authoritiesService.remove(id);
    return null;
  }
}
