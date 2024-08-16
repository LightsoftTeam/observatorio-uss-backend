import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class CreatePostCommentDto {
    @ApiProperty({
        description: 'The comment of the post',
        example: 'This is a comment',
    })
    @IsString()
    @IsNotEmpty()
    body: string;

    @ApiProperty({
        description: 'The parent id',
        example: '123e4567-es12-42d9-a456-426614174000',
        nullable: true,
    })
    @IsOptional()
    @IsUUID()
    parentId: string;
}
