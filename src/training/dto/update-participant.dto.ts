import { ApiProperty, PartialType } from "@nestjs/swagger";
import { AddParticipantDto } from "./add-participant.dto";
import { AttendanceStatus } from "../entities/training.entity";
import { IsEnum, IsOptional } from "class-validator";

export class UpdateParticipantDto extends PartialType(AddParticipantDto) {
    @ApiProperty({
        description: 'The attendance status of the participant',
        example: AttendanceStatus.ATTENDED,
        enum: AttendanceStatus,
        nullable: true,
    })
    @IsEnum(AttendanceStatus)
    @IsOptional()
    attendanceStatus?: AttendanceStatus;
}
