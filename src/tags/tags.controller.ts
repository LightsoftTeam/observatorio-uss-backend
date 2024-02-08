import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Tag } from './entities/tag.entity';

@ApiTags('tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @ApiResponse({ status: 200, description: 'The tags has been successfully retrieved.' })
  @Get()
  findAll(@Query('search') search: string) {
    return this.tagsService.findAll(search);
  }

  @ApiResponse({ status: 201, description: 'The tag has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Tag already exists.' })
  @Post()
  create(@Body() createTagDto: CreateTagDto) {
    return this.tagsService.create(createTagDto);
  }
}
