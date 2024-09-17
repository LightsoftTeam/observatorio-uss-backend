
import { ApiProperty } from '@nestjs/swagger';
import { Category } from '../entities/post.entity';
import { IsOptional } from 'class-validator';

export class GetAudioDto {
    @ApiProperty({
        nullable: true,
    })
    @IsOptional()
    userId?: string;
}