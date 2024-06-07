import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { InjectModel } from '@nestjs/azure-database';
import type { Container } from '@azure/cosmos';
import { School } from './entities/school.entity';
import { FormatCosmosItem } from 'src/common/helpers/format-cosmos-item.helper';
import { th } from '@faker-js/faker';

@Injectable()
export class SchoolsService {

  constructor(
    @InjectModel(School)
    private readonly schoolsContainer: Container,
  ) {}

  async create(createSchoolDto: CreateSchoolDto) {
    const school: School = {
      ...createSchoolDto,
      createdAt: new Date(),
    };
    const { resource } = await this.schoolsContainer.items.create(school);
    return FormatCosmosItem.cleanDocument<School>(resource);
  }

  async findAll() {
    const { resources } = await this.schoolsContainer.items.readAll<School>().fetchAll(); 
    const schools = resources.map((school) => FormatCosmosItem.cleanDocument<School>(school));
    return schools;
  }

  async findOne(id: string) {
    try {
      const { resource } = await this.schoolsContainer.item(id, id).read<School>();
      return FormatCosmosItem.cleanDocument<School>(resource);
    } catch (error) {
      throw new NotFoundException(`School with id ${id} not found`);
    }
  }

  async update(id: string, updateSchoolDto: UpdateSchoolDto) {
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
    try {
      await this.schoolsContainer.item(id, id).delete();
      return null;
    } catch (error) {
      throw new BadRequestException(`School with id ${id} not found`);
    }
  }
}
