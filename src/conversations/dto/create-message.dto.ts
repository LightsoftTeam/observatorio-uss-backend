import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
import { ChatCompletionRole } from "openai/resources";

export class CreateMessageDto {
    @ApiProperty({
        description: 'The id of the conversation',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    @IsOptional()
    id: string;

    @ApiProperty({
        description: 'The content of the message',
        example: 'Hello, how are you?',
    })
    @IsString()
    @IsNotEmpty()
    body: string;
    @ApiProperty({
        description: 'The date of the message',
        example: '2021-09-01T00:00:00.000Z',
    })
    @IsString()
    @IsNotEmpty()
    createdAt: Date;
  
   @ApiProperty({
        description: 'The role of the message',
        example: 'user',
    })
    @IsString()
    role: ChatCompletionRole;
}
