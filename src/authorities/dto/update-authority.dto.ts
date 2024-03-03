import { PartialType } from '@nestjs/swagger';
import { CreateAuthorityDto } from './create-authority.dto';

export class UpdateAuthorityDto extends PartialType(CreateAuthorityDto) {}
