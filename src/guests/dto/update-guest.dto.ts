import { PartialType } from '@nestjs/swagger';
import { CreateGuestDto } from './create-guest.dto';

export class UpdateGuestDto extends PartialType(CreateGuestDto) {}
