import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
import { Category } from "../entities/post.entity";

export class CreatePostDto {
    @ApiProperty({
        description: 'The title of the post',
        example: 'How to create a NestJS application?'
    })
    @IsString()
    @IsNotEmpty()
    title: string;
    
    @ApiProperty({
        description: 'Description of the post',
        example: 'This is a description of the post',
    })
    @IsString()
    @IsOptional()
    description: string;

    @ApiProperty({
        description: 'Category of the post',
        example: Category.NEWS,
    })
    @IsEnum(Category)
    category: Category;
    
    @ApiProperty({
        description: '',
        example: '',
    })
    @IsString()
    @IsOptional()
    videoUrl: string;
    
    @ApiProperty({
        description: '',
        example: '',
    })
    @IsString()
    @IsOptional()
    podcastUrl: string;
    
    @ApiProperty({
        description: '',
        example: '',
    })
    @IsString()
    @IsOptional()
    content: string;
    
    @ApiProperty({
        description: '',
        example: '',
    })
    @IsString()
    @IsOptional()
    imageUrl: string;
    
    @ApiProperty({
        description: '',
        example: '',
    })
    @IsString()
    @IsOptional()
    imageDescription: string;
    
    @ApiProperty({
        description: '',
        example: '',
    })
    @IsString()
    @IsUUID()
    userId: string;
    
    @ApiProperty({
        description: '',
        example: '',
    })
    @IsArray()
    attachments: string[];
    
    @ApiProperty({
        description: '',
        example: '',
    })
    @IsArray()
    tags: string[];
}
