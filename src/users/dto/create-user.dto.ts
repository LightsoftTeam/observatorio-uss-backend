import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsNotEmpty, IsString } from "class-validator";
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
        description: 'The email of the user',
        example: 'jhondoe@test.com'
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        description: 'The password of the user',
        example: 'password'
    })
    @IsString()
    @IsNotEmpty()
    password: string;

    @ApiProperty({
        description: 'The image of the user',
        example: 'https://example.com/image.jpg'
    })
    @IsString()
    @IsNotEmpty()
    image: string;

    @ApiProperty({
        description: 'The role of the user',
        example: 'author'
    })
    @IsEnum(Role)
    role: Role;
}