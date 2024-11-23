import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
import { EmploymentType, Role } from "../entities/user.entity";
import { DocumentType } from "src/common/types/document-type.enum";

export class CreateUserDto {
    @ApiProperty({
        description: 'The name of the user',
        example: 'John Doe'
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'The biography of the user',
        example: 'I am a software engineer'
    })
    @IsString()
    @IsOptional()
    biography?: string;

    @ApiProperty({
        description: 'The image of the user',
        example: 'https://example.com/image.jpg'
    })
    @IsOptional()
    image?: string;

    @ApiProperty({
        description: 'The email of the user',
        example: 'jhondoe@test.com'
    })
    @IsString()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description: 'The password of the user',
        example: 'password'
    })
    @IsString()
    @IsNotEmpty()
    password: string;

    @ApiProperty({
        description: 'The role of the user',
        example: 'author',
        nullable: true,
    })
    @IsEnum(Role)
    @IsOptional()
    role?: Role;

    @ApiProperty({
        description: 'The country code of the user',
        example: 'US',
        nullable: true,
    })
    @IsString()
    @IsOptional()
    countryCode?: string;

    @ApiProperty({
        description: 'The requested role of the user',
        example: Role.PROFESSOR,
        nullable: true,
    })
    @IsEnum(Role)
    @IsOptional()
    requestedRole?: Role;

    @ApiProperty({
        description: 'The document type of the user',
        example: DocumentType.DNI,
        nullable: true,
    })
    @IsString()
    @IsOptional()
    documentType?: DocumentType;

    @ApiProperty({
        description: 'The document number of the user',
        example: '87878787',
        nullable: true,
    })
    @IsString()
    @IsOptional()
    documentNumber?: string;

    @ApiProperty({
        description: 'The employment type of the user',
        example: EmploymentType.FULL_TIME,
        nullable: true,
        enum: EmploymentType,
    })
    @IsEnum(EmploymentType)
    @IsOptional()
    employmentType?: EmploymentType;

    @ApiProperty({
        description: 'The school id of the user',
        example: '12345678-1234-1234-1234-123456789012',
        nullable: true,
    })
    @IsUUID()
    @IsOptional()
    schoolId?: string;

    @ApiProperty({
        description: 'The flag to participate in reports',
        example: true,
        nullable: true,
    })
    @IsBoolean()
    @IsOptional()
    excludedFromReports?: boolean;
}