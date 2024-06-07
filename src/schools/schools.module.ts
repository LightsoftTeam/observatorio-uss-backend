import { Module } from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { SchoolsController } from './schools.controller';
import { School } from './entities/school.entity';
import { AzureCosmosDbModule } from '@nestjs/azure-database';

@Module({
  controllers: [SchoolsController],
  providers: [SchoolsService],
  imports: [
    AzureCosmosDbModule.forFeature([
      {dto: School},
    ]),
  ],
  exports: [
    AzureCosmosDbModule,
  ]
})
export class SchoolsModule {}
