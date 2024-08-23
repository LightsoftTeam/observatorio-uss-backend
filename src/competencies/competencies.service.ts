import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCompetencyDto } from './dto/create-competency.dto';
import { UpdateCompetencyDto } from './dto/update-competency.dto';
import type { Container } from '@azure/cosmos';
import { InjectModel } from '@nestjs/azure-database';
import { Competency } from './entities/competency.entity';
// import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ApplicationLoggerService } from 'src/common/services/application-logger.service';
import { FormatCosmosItem } from 'src/common/helpers/format-cosmos-item.helper';

@Injectable()
export class CompetenciesService {

  constructor(
    @InjectModel(Competency)
    private readonly competenciesContainer: Container,
    // @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly logger: ApplicationLoggerService,
  ) { }

  async create(createCompetencyDto: CreateCompetencyDto) {
    this.logger.log(`Creating a new competency with name: ${createCompetencyDto.name}`);
    const competency: Competency = {
      name: createCompetencyDto.name,
      createdAt: new Date(),
    };
    const { resource: createdCompetency } = await this.competenciesContainer.items.create(competency);
    this.logger.log(`Created a new competency with name: ${createdCompetency.name}`);
    return createdCompetency;
  }

  async findAll(): Promise<Partial<Competency>[]> {
    this.logger.log('Fetching all competencies');
    const querySpec = {
      query: 'SELECT * from c where NOT IS_DEFINED(c.deletedAt)',
    }
    const { resources: competencies } = await this.competenciesContainer.items.query(querySpec).fetchAll();
    return competencies.map(c => FormatCosmosItem.cleanDocument(c));
  }

  async findOne(id: string) {
    const competency = await this.getById(id);
    if (!competency) {
      throw new NotFoundException(`Competency with id ${id} not found`);
    }
    return FormatCosmosItem.cleanDocument(competency);
  }

  async getById(id: string) {
    try {
      const { resource: competency } = await this.competenciesContainer.item(id, id).read();
      return competency;
    } catch (error) {
      return null;
    }
  }

  async getByName(name: string): Promise<Competency | null> {
    this.logger.log(`Getting competency by name: ${name}`);
    const querySpec = {
      query: `SELECT * from c where c.name = @name`,
      parameters: [
        { name: '@name', value: name },
      ],
    };
    const { resources: competencies } = await this.competenciesContainer.items.query(querySpec).fetchAll();
    return competencies.at(0) ?? null;
  }

  async getByIds(ids: string[]) {
    this.logger.log('Fetching competencies with ids');
    const querySpec = {
      query: 'SELECT * from c where ARRAY_CONTAINS(@ids, c.id)',
      parameters: [
        { name: '@ids', value: ids },
      ],
    };
    const { resources: competencies } = await this.competenciesContainer.items.query(querySpec).fetchAll();
    return competencies.map(c => FormatCosmosItem.cleanDocument(c));
  }

  async update(id: string, updateCompetencyDto: UpdateCompetencyDto) {
    const competency = await this.getById(id);
    if (!competency) {
      throw new NotFoundException(`Competency with id ${id} not found`);
    }
    //TODO: verify if when updating the competency, the _ts field is not updated
    const updatedCompetency = {
      ...competency,
      ...updateCompetencyDto,
    };
    const { resource } = await this.competenciesContainer.item(id, id).replace(updatedCompetency);
    return FormatCosmosItem.cleanDocument(resource);
  }

  async remove(id: string) {
    const competency = await this.getById(id);
    if (!competency) {
      throw new NotFoundException(`Competency with id ${id} not found`);
    }
    const deletedAt = new Date();
    const updatedCompetency = {
      ...competency,
      deletedAt,
    };
    await this.competenciesContainer.item(id, id).replace(updatedCompetency);
    return null;
  }
}
