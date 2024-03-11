import { Controller, Get, Query } from '@nestjs/common';
import { TagsService } from './tags.service';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @ApiResponse({ status: 200, description: 'The tags has been successfully retrieved.' })
  @Get()
  findAll(@Query('search') search: string) {
    return this.tagsService.findAll(search);
  }
}
