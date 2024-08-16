import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @ApiResponse({
    status: 200,
    description: 'All trainings by competency were found',
  })
  @Get('trainings-by-competency')
  getTrainingsByCompetency(@Query('semesterId') semesterId: string) {
    if(!semesterId) throw new BadRequestException('SemesterId is required');
    return this.reportsService.getTrainingsByCompetency(semesterId);
  }
}