import { PartialType } from '@nestjs/swagger';
import { CreateAppConfigurationDto } from './create-app-configuration.dto';

export class UpdateAppConfigurationDto extends PartialType(CreateAppConfigurationDto) {}
