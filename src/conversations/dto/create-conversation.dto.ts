import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateConversationDto {
    @ApiProperty({
        description: 'The content of the initial message',
        example: 'How to create a NestJS application?',
    })
    @IsString()
    @IsNotEmpty()
    body: string;
}
