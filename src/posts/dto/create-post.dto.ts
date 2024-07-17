import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID } from "class-validator";
import { Category, Reference } from "../entities/post.entity";

export class CreatePostDto {
    @ApiProperty({
        description: 'The title of the post',
        example: 'How to create a NestJS application?',
    })
    @IsString()
    @IsNotEmpty()
    title: string;
    
    @ApiProperty({
        description: 'Description of the post',
        example: 'This is a description of the post',
        nullable: true,
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
        nullable: true,
    })
    @IsString()
    @IsOptional()
    videoUrl: string;
    
    @ApiProperty({
        description: '',
        example: '',
        nullable: true,
    })
    @IsString()
    @IsOptional()
    podcastUrl: string;
    
    @ApiProperty({
        description: '',
        example: '',
        nullable: true,
    })
    @IsString()
    @IsOptional()
    content: string;
    
    @ApiProperty({
        description: '',
        example: '',
        nullable: true,
    })
    @IsString()
    @IsOptional()
    imageUrl: string;
    
    @ApiProperty({
        description: '',
        example: '',
        nullable: true,
    })
    @IsString()
    @IsOptional()
    imageDescription: string;
    
    @ApiProperty({
        description: '',
        example: '',
    })
    @IsString()
    @IsOptional()
    @IsUUID()
    userId?: string;

    @ApiProperty({
        description: 'guestId of the post',
        example: 'a1b2c3d4-1234-5678-90ab-cdef12345678',
    })
    @IsOptional()
    @IsString()
    guestId?: string;
    
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

    @ApiProperty({
        description: 'Reference of the post',
        example: `
            {
                author: 'Observatorio Tec Monterrey',
                url: 'https://observatorio.tec.mx/edu-news/this-is-a-post'
            }
        `
    })
    @IsObject()
    @IsOptional()
    reference: Reference;
}
