
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AskPostDto {
    @ApiProperty({
        nullable: true,
    })
    @IsString()
    question: string;
}