import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class SendResetPasswordOtpDto {
  @ApiProperty({
    description: 'The user email',
    example: 'test@test.com'
  })
  @IsString()
  @IsNotEmpty()
  email: string;
}