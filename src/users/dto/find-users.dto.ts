import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FindUsersDto {
    @ApiProperty({
        description: 'The roles of the user',
        nullable: true,
    })
    @IsString()
    @IsOptional()
    roles?: string;

    @ApiProperty({
        description: 'The pending role request of the user',
        nullable: true,
    })
    @IsString()
    @IsOptional()
    onlyPendingRole?: string;
}