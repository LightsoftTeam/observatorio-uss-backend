import { Module } from '@nestjs/common';
import { ProfessorsService } from './professors.service';
import { ProfessorsController } from './professors.controller';
import { AzureCosmosDbModule } from '@nestjs/azure-database';
import { Professor } from './entities/professor.entity';
import { SchoolsService } from 'src/schools/schools.service';
import { SchoolsModule } from 'src/schools/schools.module';
import { CommonModule } from 'src/common/common.module';
import { UsersModule } from 'src/users/users.module';
import { UsersService } from 'src/users/users.service';
import { AuthModule } from 'src/auth/auth.module';
import { Training } from 'src/training/entities/training.entity';
import { ProfessorReportsService } from './services/professor-reports.service';

@Module({
  controllers: [ProfessorsController],
  providers: [ProfessorsService, SchoolsService, UsersService, ProfessorReportsService],
  imports: [
    AzureCosmosDbModule.forFeature([
      {dto: Professor},
      {dto: Training},
    ]),
    SchoolsModule,
    CommonModule,
    UsersModule,
    AuthModule,
  ],
  exports: [AzureCosmosDbModule, SchoolsService]
})
export class ProfessorsModule {}
