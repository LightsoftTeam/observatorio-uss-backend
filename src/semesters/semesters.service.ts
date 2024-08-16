import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSemesterDto } from './dto/create-semester.dto';
import { UpdateSemesterDto } from './dto/update-semester.dto';
import { InjectModel } from '@nestjs/azure-database';
import { Semester } from './entities/semester.entity';
import type { Container } from '@azure/cosmos';
import { ApplicationLoggerService } from 'src/common/services/application-logger.service';

@Injectable()
export class SemestersService {

  constructor(
    @InjectModel(Semester)
    private readonly semestersContainer: Container,
    private readonly logger: ApplicationLoggerService,
  ) {
    this.logger.setContext(SemestersService.name);
  }
  
  async create(createSemesterDto: CreateSemesterDto) {
    createSemesterDto.name = createSemesterDto.name.trim().toUpperCase();
    const semester: Semester = {
      ...createSemesterDto,
      createdAt: new Date(),
    };
    const { resource } = await this.semestersContainer.items.create(semester);
    return resource;
  }

  async findAll() {
    const querySpec = {
      query: 'SELECT * FROM c WHERE NOT IS_DEFINED(c.deletedAt)',
    };
    const { resources } = await this.semestersContainer.items.query(querySpec).fetchAll();
    return resources;
  }

  async findOne(id: string) {
    try {
      const { resource } = await this.semestersContainer.item(id, id).read();
    return resource;
    } catch (error) {
      throw new NotFoundException(`Semester with id ${id} not found`);
    }
  }

  async getByIds(ids: string[]) {
    this.logger.debug(`Getting semesters by ids: ${ids}`);
    const querySpec = {
      query: `SELECT * FROM c WHERE ARRAY_CONTAINS(@ids, c.id)`,
      parameters: [
        {
          name: '@ids',
          value: ids,
        },
      ],
    };
    const { resources } = await this.semestersContainer.items.query(querySpec).fetchAll();
    return resources;
  }

  async update(id: string, updateSemesterDto: UpdateSemesterDto) {
    if(updateSemesterDto.name) {
      updateSemesterDto.name = updateSemesterDto.name.trim().toUpperCase();
    }
    const semester = await this.findOne(id);
    const updatedSemester = {
      ...semester,
      ...updateSemesterDto,
    };
    const { resource } = await this.semestersContainer.item(id, id).replace(updatedSemester);
    return resource;
  }

  async remove(id: string) {
    const semester = await this.findOne(id);
    const updatedSemester = {
      ...semester,
      deletedAt: new Date(),
    };
    const { resource } = await this.semestersContainer.item(id, id).replace(updatedSemester);
    return null;
  }
}
