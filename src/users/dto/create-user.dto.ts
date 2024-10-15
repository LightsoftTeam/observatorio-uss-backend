import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Role } from "../entities/user.entity";

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
    image: string;

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
    role: Role;

    @ApiProperty({
        description: 'The country code of the user',
        example: 'US',
        nullable: true,
    })
    @IsString()
    @IsOptional()
    countryCode: string;
}