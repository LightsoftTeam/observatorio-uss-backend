
import { ApiProperty } from '@nestjs/swagger';
import { Category } from '../entities/post.entity';

export class GetPostsDto {
    @ApiProperty({
        enum: Category,
    })
    category: Category;
}