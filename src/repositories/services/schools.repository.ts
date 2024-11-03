import { InjectModel } from '@nestjs/azure-database';
import { Injectable } from '@nestjs/common';
import { Container } from '@azure/cosmos';
import { ApplicationLoggerService } from 'src/common/services/application-logger.service';
import { School } from 'src/schools/entities/school.entity';

@Injectable()
export class SchoolsRepository {
    constructor(
        @InjectModel(School)
        private readonly schoolsContainer: Container,
        private readonly logger: ApplicationLoggerService,
    ) { }

    async findAll(): Promise<School[]> {
        this.logger.debug('Getting all schools');
        const { resources } = await this.schoolsContainer.items.readAll<School>().fetchAll();
        return resources;
    }
}
