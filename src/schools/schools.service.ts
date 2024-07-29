import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { InjectModel } from '@nestjs/azure-database';
import type { Container } from '@azure/cosmos';
import { School } from './entities/school.entity';
import { FormatCosmosItem } from 'src/common/helpers/format-cosmos-item.helper';
import { ApplicationLoggerService } from 'src/common/services/application-logger.service';

@Injectable()
export class SchoolsService {

  constructor(
    @InjectModel(School)
    private readonly schoolsContainer: Container,
    private readonly logger: ApplicationLoggerService,
  ) {
    this.logger.setContext(SchoolsService.name);
  }

  async create(createSchoolDto: CreateSchoolDto) {
    this.logger.log(`Creating school: ${JSON.stringify(createSchoolDto)}`);
    const school: School = {
      ...createSchoolDto,
      createdAt: new Date(),
    };
    const { resource } = await this.schoolsContainer.items.create(school);
    return FormatCosmosItem.cleanDocument<School>(resource);
  }

  async findAll() {
    this.logger.log('Getting all schools');
    const { resources } = await this.schoolsContainer.items.readAll<School>().fetchAll();
    const schools = resources.map((school) => FormatCosmosItem.cleanDocument<School>(school));
    return schools;
  }

  async findOne(id: string) {
    this.logger.log(`Getting school with id ${id}`);
    try {
      const { resource } = await this.schoolsContainer.item(id, id).read<School>();
      return FormatCosmosItem.cleanDocument<School>(resource);
    } catch (error) {
      this.logger.error(error.message);
      this.logger.error(error.stack);
      throw new NotFoundException(`School with id ${id} not found`);
    }
  }

  async getById(id: string) {
    try {
      this.logger.log(`Getting school with id ${id}`);
      const { resource } = await this.schoolsContainer.item(id, id).read<School>();
      return resource;
    } catch (error) {
      //verify if the error is a 404
      return null;
    }
  }

  async getByIds(ids: string[]) {
    this.logger.log('Fetching schools with ids');
    const querySpec = {
      query: 'SELECT * from c where ARRAY_CONTAINS(@ids, c.id)',
      parameters: [
        {
          name: '@ids',
          value: ids,
        },
      ],
    };
    const { resources } = await this.schoolsContainer.items.query(querySpec).fetchAll();
    return resources.map((school) => FormatCosmosItem.cleanDocument<School>(school));
  }

  async update(id: string, updateSchoolDto: UpdateSchoolDto) {
    this.logger.log(`Updating school with id ${id}: ${JSON.stringify(updateSchoolDto)}`);
    const { resource } = await this.schoolsContainer.item(id, id).read<School>();
    if (!resource) {
      throw new NotFoundException(`School with id ${id} not found`);
    }
    const school = {
      ...resource,
      ...updateSchoolDto,
    };
    const { resource: updatedResource } = await this.schoolsContainer.item(id).replace(school);
    return FormatCosmosItem.cleanDocument<School>(updatedResource);
  }

  async remove(id: string) {
    this.logger.log(`Deleting school with id ${id}`);
    try {
      await this.schoolsContainer.item(id, id).delete();
      return null;
    } catch (error) {
      this.logger.error(error.message);
      this.logger.error(error.stack);
      throw new BadRequestException(`School with id ${id} not found`);
    }
  }
}
