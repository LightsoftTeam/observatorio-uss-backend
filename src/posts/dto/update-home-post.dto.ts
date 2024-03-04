
import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class UpdateHomePostDto {
    @ApiProperty({
        description: 'The id of the post to be added to the home section',
        example: '123e4567-e89b-12d3-a456-426614174000'
    })
    @IsString()
    @IsNotEmpty()
    postId: string;
}
