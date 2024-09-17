import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateMessageDto {
    @ApiProperty({
        description: 'The content of the message',
        example: 'Hello, how are you?',
    })
    @IsString()
    @IsNotEmpty()
    body: string;
}
