
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { Role } from '../entities/user.entity';

export class FindUsersDto {
    @ApiProperty({
        description: 'The roles of the user',
        nullable: true,
    })
    @IsString()
    @IsOptional()
    roles?: string;
}