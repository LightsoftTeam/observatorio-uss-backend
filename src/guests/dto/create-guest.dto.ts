import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { DocumentType } from "src/common/types/document-type.enum";

export class CreateGuestDto {
    @ApiProperty({
        description: 'The name of the guest',
        example: 'John Doe',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'The image of the guest',
        example: 'https://example.com/image.jpg',
    })
    @IsString()
    @IsOptional()
    image: string;

    @ApiProperty({
        description: 'The email of the guest',
        example: '',
    })
    @IsString()
    email: string;

    @ApiProperty({
        description: 'The document type of the guest',
        example: 'ID',
    })
    @IsEnum(DocumentType)
    documentType: DocumentType;

    @ApiProperty({
        description: 'The document number of the guest',
        example: '123456789',
    })
    @IsString()
    documentNumber: string;

    @ApiProperty({
        description: 'The token of the guest',
        example: false,
    })
    verificationCode: string;
}
