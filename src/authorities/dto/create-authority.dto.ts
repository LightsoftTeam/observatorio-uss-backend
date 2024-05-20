import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsOptional, IsString } from "class-validator";

export class CreateAuthorityDto {
    @ApiProperty({
        description: 'The name of the authority',
        example: 'John Doe',
    })
    @IsString()
    @IsOptional()
    name: string;

    @ApiProperty({
        description: 'Description of the authority',
        example: 'This is a description of the authority',
        nullable: true,
    })
    @IsString()
    @IsOptional()
    description: string;

    @ApiProperty({
        description: 'The image of the authority',
        example: 'https://example.com/image.jpg',
        nullable: true,
    })
    @IsString()
    @IsOptional()
    imageUrl: string;
    
    @ApiProperty({
        description: 'The position of the authority',
        example: 'CEO',
        nullable: true,
    })
    @IsString()
    @IsOptional()
    position: string;

    @ApiProperty({
        description: 'The hierarchy of the authority',
        example: 0,
        nullable: true,
    })
    @IsOptional()
    hierarchy: number;

    @ApiProperty({
        description: 'The social media of the authority',
        example: ['https://example.com/social-media']
    })
    @IsArray()
    @IsString({ each: true })
    socialMedia: string[];
}
