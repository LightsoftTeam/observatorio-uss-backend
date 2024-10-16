import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateConversationDto {
    @ApiProperty({
        description: 'The id of the conversation',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    @IsOptional()
    id: string;

    @ApiProperty({
        description: 'The title of the conversation',
        example: 'How to create a NestJS application?',
    })
    @IsString()
    @IsOptional()
    title: string;

    @ApiProperty({
        description: 'The lastMessageAt of the conversation',
        example: '2022-02-02T00:00:00.000Z',
    })
    @IsString()
    @IsOptional()
    lastMessageAt: Date;

    @ApiProperty({
        description: 'The userId of the conversation',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    @IsOptional()
    userId: string;

    @ApiProperty({
        description: 'The createdAt of the conversation',
        example: '2022-02-02T00:00:00.000Z',
    })
    @IsString()
    @IsNotEmpty()
    createdAt: Date;
}
