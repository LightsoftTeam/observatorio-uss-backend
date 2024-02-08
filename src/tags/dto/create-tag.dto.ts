import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateTagDto {
    @ApiProperty({
        description: 'The name of the tag',
        example: 'Chat gpt-3',
    })
    @IsString()
    @IsNotEmpty()
    name: string;
}