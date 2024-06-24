import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { AttendanceStatus, TrainingRole } from "../entities/training.entity";

export class AddAttendanceToExecutionDto {
    @ApiProperty({
        description: 'A valid participant id',
        example: 'a3b4c5d6-1234-5678-90ab-cdef12345678',
    })
    @IsString()
    @IsNotEmpty()
    participantId: string;
    @ApiProperty({
        description: 'The status of the participant in the execution.',
        example: AttendanceStatus.ATTENDED,
        enum: AttendanceStatus,
        nullable: true,
        default: AttendanceStatus.ATTENDED,
    })
    @IsEnum(AttendanceStatus)
    @IsOptional()
    status?: AttendanceStatus;
}
