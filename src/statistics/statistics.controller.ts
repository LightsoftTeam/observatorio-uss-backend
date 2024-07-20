import { Controller, Post } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Statistics')
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Post('register-visit')
  @ApiResponse({ status: 200, description: 'Visit registered successfully' })
  registerVisit() {
    return this.statisticsService.registerVisit();
  }
}
