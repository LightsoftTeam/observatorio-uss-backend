import { Module } from '@nestjs/common';
import { ProfessorsService } from './professors.service';
import { ProfessorsController } from './professors.controller';
import { AzureCosmosDbModule } from '@nestjs/azure-database';
import { Professor } from './entities/professor.entity';
import { SchoolsService } from 'src/schools/schools.service';
import { SchoolsModule } from 'src/schools/schools.module';

@Module({
  controllers: [ProfessorsController],
  providers: [ProfessorsService, SchoolsService],
  imports: [
    AzureCosmosDbModule.forFeature([
      {dto: Professor},
    ]),
    SchoolsModule
  ]
})
export class ProfessorsModule {}
