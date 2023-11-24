import { Category } from "../types/category.enum";
import { ApiProperty } from '@nestjs/swagger';

export class GetPostsDto {
    @ApiProperty({
        enum: Category,
    })
    category: Category;
}