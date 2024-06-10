import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { TrainingRole } from "../entities/training.entity";

export class AddParticipantDto {
    @ApiProperty({
        description: 'A valid professor id',
        example: 'a3b4c5d6-1234-5678-90ab-cdef12345678',
    })
    @IsString()
    @IsNotEmpty()
    professorId: string;
    @ApiProperty({
        description: 'The role of the professor',
        example: TrainingRole.ASSISTANT,
        enum: TrainingRole,
        nullable: true,
        default: TrainingRole.ASSISTANT,
    })
    @IsEnum(TrainingRole)
    @IsOptional()
    role?: TrainingRole;
}
