import { PartialType } from '@nestjs/swagger';
import { CreateTrainingDto } from './create-training.dto';

export class UpdateTrainingDto extends PartialType(CreateTrainingDto) {}
