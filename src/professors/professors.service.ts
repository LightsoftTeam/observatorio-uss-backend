import { Injectable, NotFoundException } from '@nestjs/common';
import type { Container } from '@azure/cosmos';
import { CreateProfessorDto } from './dto/create-professor.dto';
import { UpdateProfessorDto } from './dto/update-professor.dto';
import { Professor } from './entities/professor.entity';
import { InjectModel } from '@nestjs/azure-database';
import { FormatCosmosItem } from 'src/common/helpers/format-cosmos-item.helper';
import { SchoolsService } from 'src/schools/schools.service';

@Injectable()
export class ProfessorsService {

  constructor(
    @InjectModel(Professor)
    private readonly professorsContainer: Container,
    private readonly schoolService: SchoolsService,
  ) { }

  async create(createProfessorDto: CreateProfessorDto) {
    await this.schoolService.findOne(createProfessorDto.schoolId);// Check if the school exists
    const professor: Professor = {
      ...createProfessorDto,
      createdAt: new Date(),
    }
    const { resource } = await this.professorsContainer.items.create(professor);
    return FormatCosmosItem.cleanDocument<Professor>(resource);
  }

  async findAll() {
    const { resources } = await this.professorsContainer.items.readAll<Professor>().fetchAll();
    return resources.map((professor) => FormatCosmosItem.cleanDocument<Professor>(professor));
  }

  async findOne(id: string) {
    try {
      const { resource } = await this.professorsContainer.item(id, id).read<Professor>();
      return FormatCosmosItem.cleanDocument<Professor>(resource);
    } catch (error) {
      throw new NotFoundException(`Professor with id ${id} not found`);
    }
  }

  async update(id: string, updateProfessorDto: UpdateProfessorDto) {
    const { schoolId } = updateProfessorDto
    if (schoolId) {
      await this.schoolService.findOne(schoolId);// Check if the school exists
    }
    try {
      const { resource: professor } = await this.professorsContainer.item(id, id).read<Professor>();
      const newProfessor: Professor = {
        ...professor,
        ...updateProfessorDto,
      }
      const { resource } = await this.professorsContainer.item(id).replace(newProfessor);
      return FormatCosmosItem.cleanDocument<Professor>(resource);
    } catch (error) {
      console.log(error.message)
      throw new NotFoundException(`Professor with id ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      await this.professorsContainer.item(id, id).delete();
      return null;
    } catch (error) {
      throw new NotFoundException(`Professor with id ${id} not found`);
    }
  }

  async findByDocument({ documentType, documentNumber }: { documentType: string, documentNumber: string }) {
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.documentType = @documentType AND c.documentNumber = @documentNumber',
      parameters: [
        { name: '@documentType', value: documentType },
        { name: '@documentNumber', value: documentNumber },
      ],
    };
    const { resources } = await this.professorsContainer.items.query<Professor>(querySpec).fetchAll();
    if (resources.length === 0) {
      throw new NotFoundException(`Professor with document ${documentType} ${documentNumber} not found`);
    }
    const professor = resources[0];
    return FormatCosmosItem.cleanDocument<Professor>(professor);
  }
}
