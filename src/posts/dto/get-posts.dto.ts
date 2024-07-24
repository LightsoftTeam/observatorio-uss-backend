
import { ApiProperty } from '@nestjs/swagger';
import { Category } from '../entities/post.entity';
import { IsOptional } from 'class-validator';

export class GetPostsDto {
    @ApiProperty({
        enum: Category,
        nullable: true,
    })
    @IsOptional()
    category?: Category;
    @ApiProperty({
        nullable: true,
    })
    @IsOptional()
    userId?: string;
    @ApiProperty({
        nullable: true,
    })
    @IsOptional()
    guestId?: string;
}