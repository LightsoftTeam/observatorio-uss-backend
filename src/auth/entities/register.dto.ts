import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";
import { CreateUserDto } from "src/users/dto/create-user.dto";
import { Type } from "class-transformer";
import { Role } from "src/users/entities/user.entity";

export class RegisterDto {
    @ApiProperty({
        description: 'The user details',
    })
    @ValidateNested({ each: true })
    @Type(() => CreateUserDto)
    user: CreateUserDto;

    @ApiProperty({
        description: 'The verification code',
        example: 'A1B2C3',
    })
    @IsString()
    @IsNotEmpty()
    verificationCode: string;
}