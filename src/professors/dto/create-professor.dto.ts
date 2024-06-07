import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { DocumentType } from "../entities/professor.entity";

export class CreateProfessorDto {
    @ApiProperty({
        description: 'The name of the professor',
        example: 'John Doe',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'The email of the professor',
        example: 'jhon.doe@uss.com',
    })
    @IsString()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description: 'The document type of the professor',
        example: 'dni',
    })
    @IsEnum(DocumentType)
    documentType: DocumentType;

    @ApiProperty({
        description: 'The document number of the professor',
        example: '12345678',
    })
    @IsString()
    @IsNotEmpty()
    documentNumber: string;

    @ApiProperty({
        description: 'The school id of the professor',
        example: '60f4b3b3-1b7b-4b6b-8b7b-1b7b4b6b8b7b',
    })
    @IsString()
    @IsNotEmpty()
    schoolId: string;
}
