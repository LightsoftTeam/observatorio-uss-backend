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

@Module({
  controllers: [ProfessorsController],
  providers: [ProfessorsService, SchoolsService, UsersService],
  imports: [
    AzureCosmosDbModule.forFeature([
      {dto: Professor},
    ]),
    SchoolsModule,
    CommonModule,
    UsersModule,
    AuthModule,
  ],
  exports: [AzureCosmosDbModule, SchoolsService]
})
export class ProfessorsModule {}
