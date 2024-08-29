
import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";
import { ApprovalStatus, Category } from "../entities/post.entity";
import { Type } from "class-transformer";

export class NewDataDto {
    @ApiProperty({
        description: 'The title of the post',
        example: 'The title of the post',
    })
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    title: string;

    @ApiProperty({
        description: 'Category of the post',
        example: Category.NEWS,
    })
    @IsEnum(Category)
    @IsOptional()
    category: string;

    @ApiProperty({
        description: 'Description of the post',
        example: 'This is a description of the post',
        nullable: true,
    })
    @IsString()
    @IsOptional()
    description: string;

    @ApiProperty({
        description: 'The URL of the video',
        example: 'https://www.youtube.com/watch?v=videoId',
        nullable: true,
    })
    @IsString()
    @IsOptional()
    videoUrl: string;

    @ApiProperty({
        description: 'The URL of the podcast',
        example: 'https://www.podcast.com/podcastId',
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
        nullable: true
    })
    @IsArray()
    @IsOptional()
    attachments: string[];


    @ApiProperty({
        description: 'The tags of the post',
        example: ['tag1', 'tag2'],
        nullable: true,
    })
    @IsArray()
    @IsOptional()
    tags: string[];
}

export class UpdatePostRequestDto {
    @ApiProperty({
        description: 'The action to be performed on the post',
        example: ApprovalStatus.APPROVED,
        enum: ApprovalStatus,
    })
    @IsEnum(ApprovalStatus)
    approvalStatus: ApprovalStatus;
    @ApiProperty({
        description: 'The reason for rejecting the post',
        example: 'The post is not relevant',
        required: false,
    })
    @IsString()
    @IsOptional()
    rejectionReason?: string;

    @ApiProperty({
        description: 'The new data of the post',
        example: {
            title: 'The title of the post',
            category: Category.NEWS,
            description: 'This is a description of the post',
            videoUrl: 'https://www.youtube.com/watch?v=videoId',
            podcastUrl: 'https://www.podcast.com/podcastId',
            content: 'The content of the post',
            imageUrl: 'https://www.image.com/imageId',
            imageDescription: 'The description of the image',
            attachments: ['attachment1', 'attachment2'],
        },
        nullable: true,
    })
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => NewDataDto)
    newData?: NewDataDto;
}