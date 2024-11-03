import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetProfessorParticipationBySchoolDto } from 'src/reports/dto/get-professor-participation-by-school.dto';

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

  @Get('professor-participation-by-years')
  @ApiResponse({
    status: 200,
    description: 'The assistance by year was found',
  })
  @ApiResponse({
    status: 404,
    description: 'Professor not found',
  })
  getAssistanceByYear() {
    return this.reportsService.getProfessorParticipationByYears();
  }
  
  @Get('professor-participation')
  @ApiResponse({
    status: 200,
    description: 'The assistance by semester was found',
  })
  getProfessorParticipationBySemester(@Query('semesterId') semesterId: string) {
    if(!semesterId) throw new BadRequestException('SemesterId is required');
    return this.reportsService.getProfessorParticipation(semesterId);
  }

  @Get('professors-by-employment-type')
  @ApiResponse({
    status: 200,
    description: 'The employment type report was found',
  })
  getEmploymentType() {
    return this.reportsService.getProfessorEmploymentTypeReport();
  }

  @Get('professor-participation-by-school')
  @ApiResponse({
    status: 200,
    description: 'The assistance by school was found',
  })
  getProfessorParticipationBySchool(@Query() getProfessorParticipationBySchoolDto: GetProfessorParticipationBySchoolDto) {
    return this.reportsService.getProfessorParticipationBySchool(getProfessorParticipationBySchoolDto);
  }
}