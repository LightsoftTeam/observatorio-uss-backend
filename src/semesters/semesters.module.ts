import { Module } from '@nestjs/common';
import { SemestersService } from './semesters.service';
import { SemestersController } from './semesters.controller';
import { AzureCosmosDbModule } from '@nestjs/azure-database';
import { Semester } from './entities/semester.entity';
import { CommonModule } from 'src/common/common.module';

@Module({
  controllers: [SemestersController],
  providers: [SemestersService],
  imports: [
    AzureCosmosDbModule.forFeature([
      {
        dto: Semester
      }
    ]),
    CommonModule,
  ],
  exports: [AzureCosmosDbModule],
})
export class SemestersModule { }
