
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class UploadFileDto {
    @ApiProperty({
        description: 'The name of the file',
        example: 'historical-figures',
        nullable: true,
    })
    @IsOptional()
    name?: string;

    @ApiProperty({
        description: 'Save the reference of the file in the database',
        example: false,
        nullable: true,
        default: false,
    })
    @IsOptional()
    saveReference?: boolean;
}