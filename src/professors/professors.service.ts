import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Container } from '@azure/cosmos';
import { CreateProfessorDto } from './dto/create-professor.dto';
import { UpdateProfessorDto } from './dto/update-professor.dto';
import { Professor } from './entities/professor.entity';
import { InjectModel } from '@nestjs/azure-database';
import { FormatCosmosItem } from 'src/common/helpers/format-cosmos-item.helper';
import { SchoolsService } from 'src/schools/schools.service';
import { ApplicationLoggerService } from 'src/common/services/application-logger.service';

enum ERROR_CODES {
  PROFESSOR_ALREADY_EXISTS = 'PROFESSOR_ALREADY_EXISTS',
}

@Injectable()
export class ProfessorsService {

  constructor(
    @InjectModel(Professor)
    private readonly professorsContainer: Container,
    private readonly schoolService: SchoolsService,
    private readonly logger: ApplicationLoggerService,
  ) { }

  async create(createProfessorDto: CreateProfessorDto) {
    this.logger.log(`Creating professor: ${JSON.stringify(createProfessorDto)}`);
    await this.schoolService.findOne(createProfessorDto.schoolId);// Check if the school exists
    const { documentNumber, documentType } = createProfessorDto;
    const professorAlreadyExists = await this.getByDocument({ documentNumber, documentType });
    if (professorAlreadyExists) {
      throw new BadRequestException({
        statusCode: 400,
        code: ERROR_CODES.PROFESSOR_ALREADY_EXISTS,
        message: `Professor with document ${documentType} ${documentNumber} already exists`,
      });
    }
    const professor: Professor = {
      ...createProfessorDto,
      createdAt: new Date(),
    }
    const { resource } = await this.professorsContainer.items.create(professor);
    return FormatCosmosItem.cleanDocument<Professor>(resource);
  }

  async findAll() {
    this.logger.log('Getting all professors');
    const { resources } = await this.professorsContainer.items.readAll<Professor>().fetchAll();
    return resources.map((professor) => FormatCosmosItem.cleanDocument<Professor>(professor));
  }

  async findOne(id: string) {
    this.logger.log(`Getting professor with id ${id}`);
    try {
      const { resource } = await this.professorsContainer.item(id, id).read<Professor>();
      return FormatCosmosItem.cleanDocument<Professor>(resource);
    } catch (error) {
      throw new NotFoundException(`Professor with id ${id} not found`);
    }
  }

  async update(id: string, updateProfessorDto: UpdateProfessorDto) {
    this.logger.log(`Updating professor with id ${id}: ${JSON.stringify(updateProfessorDto)}`);
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
      this.logger.error(error.message)
      throw new NotFoundException(`Professor with id ${id} not found`);
    }
  }

  async remove(id: string) {
    this.logger.log(`Deleting professor with id ${id}`);
    try {
      await this.professorsContainer.item(id, id).delete();
      return null;
    } catch (error) {
      this.logger.error(error.message)
      throw new NotFoundException(`Professor with id ${id} not found`);
    }
  }

  async findByDocument({ documentType, documentNumber }: { documentType: string, documentNumber: string }) {
    const resource = await this.getByDocument({ documentType, documentNumber });
    if (!resource) {
      throw new NotFoundException(`Professor with document ${documentType} ${documentNumber} not found`);
    }
    return FormatCosmosItem.cleanDocument<Professor>(resource);
  }

  async getByDocument({ documentType, documentNumber }: { documentType: string, documentNumber: string }): Promise<Professor | null> {
    this.logger.log(`Getting professor with document ${documentType} ${documentNumber}`);
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.documentType = @documentType AND c.documentNumber = @documentNumber',
      parameters: [
        { name: '@documentType', value: documentType },
        { name: '@documentNumber', value: documentNumber },
      ],
    };
    const { resources } = await this.professorsContainer.items.query<Professor>(querySpec).fetchAll();
    if (resources.length === 0) {
      this.logger.log(`Professor with document ${documentType} ${documentNumber} not found`);
      return null;
    }
    return resources[0];
  }


  async getById(id: string) {
    try {
      this.logger.log(`Getting professor with id ${id}`);
      const { resource } = await this.professorsContainer.item(id, id).read<Professor>();
      return resource;
    } catch (error) {
      return null;
    }
  }
}