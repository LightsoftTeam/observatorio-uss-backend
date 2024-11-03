import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class GetProfessorParticipationBySchoolDto {
    @ApiProperty({
        description: 'The semester id',
        example: '123e4567-e89b-12d3-a456-426614174000',
        nullable: true,
    })
    @IsUUID()
    @IsOptional()
    semesterId?: string;

    @ApiProperty({
        description: 'The training id',
        example: '123e4567-ed89-12d3-a456-426614174000',
        nullable: true,
    })
    @IsUUID()
    @IsOptional()
    trainingId?: string;
}