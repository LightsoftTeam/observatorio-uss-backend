import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SignInDto {
  @ApiProperty({
    description: 'The email of the user',
    example: 'test@test.com'
  })
  @IsString()
  email: string;

  @ApiProperty({
    description: 'The password of the user',
    example: 'password'
  })
  @IsString()
  password: string;
}