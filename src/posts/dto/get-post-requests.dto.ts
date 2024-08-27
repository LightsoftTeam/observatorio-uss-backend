
import { ApiProperty } from '@nestjs/swagger';
import { Category } from '../entities/post.entity';
import { IsOptional } from 'class-validator';

export class GetPostRequestsDto {
    @ApiProperty({
        nullable: true,
    })
    @IsOptional()
    userId?: string;
}