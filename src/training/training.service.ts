import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import type { Container } from '@azure/cosmos';
import { v4 as uuidv4 } from 'uuid';
import { CreateTrainingDto } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';
import { InjectModel } from '@nestjs/azure-database';
import { Execution, Training } from './entities/training.entity';
import { isUUID } from 'class-validator';
import { FormatCosmosItem } from 'src/common/helpers/format-cosmos-item.helper';

const DDA_ORGANIZER_ID = 'DDA';

enum ERROR_CODES {
  TRAINING_CODE_ALREADY_EXISTS = 'TRAINING_CODE_ALREADY_EXISTS',
}

@Injectable()
export class TrainingService {
  constructor(
    @InjectModel(Training)
    private readonly trainingContainer: Container,
  ) { }

  async create(createTrainingDto: CreateTrainingDto) {
    const { executions, organizer, code } = createTrainingDto;
    const existingTraining = await this.findByCode(code);
    if (existingTraining) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        code: ERROR_CODES.TRAINING_CODE_ALREADY_EXISTS,
        message: 'The training code already exists.',
      });
    }
    if (organizer !== DDA_ORGANIZER_ID && !isUUID(organizer)) {
      throw new Error('The organizer must be a valid schoolId or DDA.');
    }
    const training: Training = {
      ...createTrainingDto,
      executions: executions.map((execution) => ({
        ...execution,
        id: uuidv4(),
      })),
      participants: [],
      createdAt: new Date(),
    };
    const { resource } = await this.trainingContainer.items.create(training);
    return FormatCosmosItem.cleanDocument(resource);
  }

  async findByCode(code: string): Promise<Training | null> {
    const { resources } = await this.trainingContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.code = @code',
        parameters: [{ name: '@code', value: code }],
      })
      .fetchAll();
    return resources.at(0);
  }

  async findAll() {
    const { resources } = await this.trainingContainer.items.readAll<Training>().fetchAll();
    return resources.map(training => FormatCosmosItem.cleanDocument<Training>(training));
  }

  async findOne(id: string) {
    try {
      const { resource } = await this.trainingContainer.item(id, id).read<Training>();
      return FormatCosmosItem.cleanDocument(resource);
    } catch (error) {
      throw new BadRequestException("Training not found");
    }
  }

  async update(id: string, updateTrainingDto: UpdateTrainingDto) {
    try {
      const { resource } = await this.trainingContainer.item(id, id).read<Training>();
      const { executions } = updateTrainingDto;
      let mappedExecutions: Execution[] = resource.executions;
      if (executions) {
        mappedExecutions = executions.map((execution) => {
          if (!execution.id) {
            return {
              ...execution,
              id: uuidv4(),
            } as Execution;
          }
          return execution as Execution;
        });
      }
      const newTraining: Training = {
        ...resource,
        ...updateTrainingDto,
        executions: mappedExecutions,
      };
      const { resource: trainingUpdated } = await this.trainingContainer.item(id, id).replace(newTraining);
      return FormatCosmosItem.cleanDocument(trainingUpdated);
    } catch (error) {
      throw new BadRequestException("Training not found");
    }
  }

  async remove(id: string) {
    try {
      await this.trainingContainer.item(id, id).delete();
      return null;
    } catch (error) {
      throw new BadRequestException("Training not found");
    }
  }
}
