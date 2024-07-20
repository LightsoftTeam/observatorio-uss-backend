import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SendOTPDto {
  @ApiProperty({
    description: 'The email of the user',
    example: 'test@test.com'
  })
  @IsString()
  @IsNotEmpty()
  email: string;
}