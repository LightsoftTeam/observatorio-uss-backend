import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AppConfigurationService } from './app-configuration.service';
import { CreateAppConfigurationDto } from './dto/create-app-configuration.dto';
import { UpdateAppConfigurationDto } from './dto/update-app-configuration.dto';

@Controller('app-configuration')
export class AppConfigurationController {
  constructor(private readonly appConfigurationService: AppConfigurationService) {}

  @Get()
  findAll() {
    return this.appConfigurationService.findAll();
  }

  @Patch(':code')
  update(@Param('code') code: string, @Body() updateAppConfigurationDto: UpdateAppConfigurationDto) {
    return this.appConfigurationService.update(code, updateAppConfigurationDto);
  }
}
