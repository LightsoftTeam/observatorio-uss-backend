import { ApiProperty } from "@nestjs/swagger";
import { AttendanceStatus, TrainingModality, TrainingRole } from "../entities/training.entity";
import { DocumentType } from "src/professors/entities/professor.entity";
import { ERROR_CODES } from "../services/participants.service";

class TrainingDto {
    @ApiProperty({
        description: 'A valid training id',
        example: 'a3b4c5d6-1234-5678-90ab-cdef12345678',
    })
    id: string;
    @ApiProperty({
        description: 'The name of the training',
        example: 'NestJS for beginners',
    })
    name: string;
    @ApiProperty({
        description: 'The code of the training',
        example: '004-2024-II',
    })
    code: string;
    @ApiProperty({
        description: 'The modality of the training',
        example: TrainingModality.PRESENTIAL,
        enum: TrainingModality,
    })
    modality: TrainingModality
}

class ExecutionDto{
    @ApiProperty({
        description: 'A valid execution id',
        example: 'a3b4c5d6-1234-5678-90ab-cdef12345678',
    })
    id: string;
    @ApiProperty({
        description: 'The date and time when the training will start',
        example: '2024-02-01T08:00:00Z',
    })
    from: string;
    @ApiProperty({
        description: 'The date and time when the training will end',
        example: '2024-02-01T17:00:00Z',
    })
    to: string;
    @ApiProperty({
        description: 'If the participant attended the training',
        example: true,
    })
    participantAttend: boolean;
}

class ProfessorDto{
    @ApiProperty({
        description: 'The id of the professor',
        example: 'a3b4c5d6-1234-5678-90ab-cdef12345678',
    })
    id: string;
    @ApiProperty({
        description: 'The name of the professor',
        example: 'John Doe',
    })
    name: string;
    @ApiProperty({
        description: 'The email of the professor',
        example: 'jhon@uss.edu.pe',
    })
    email: string;
    @ApiProperty({
        description: 'The document type of the professor',
        example: DocumentType.DNI,
        enum: DocumentType,
    })
    documentType: DocumentType;
    @ApiProperty({
        description: 'The document number of the professor',
        example: '12345678',
    })
    documentNumber: string;
    @ApiProperty({
        description: 'The school id of the professor',
        example: 'a3b4c5d6-1234-5678-90ab-cdef12345678',
    })
    schoolId: string;
    @ApiProperty({
        description: 'The creation date of the professor',
        example: '2024-02-01T08:00:00Z',
    })
    createdAt: string;
}

class ParticipantDto{
    @ApiProperty({
        description: 'A valid participant id',
        example: 'a3b4c5d6-1234-5678-90ab-cdef12345678',
    })
    id: string;
    @ApiProperty({
        description: 'Id of the professor',
        example: 'a3b4c5d6-1234-5678-90ab-cdef12345678',
    })
    foreignId: string;
    @ApiProperty({
        description: 'The role of the participant',
        example: TrainingRole.ASSISTANT,
        enum: TrainingRole,
    })
    role: TrainingRole;
    @ApiProperty({
        description: 'The status of the participant',
        example: AttendanceStatus.PRESENT,
        enum: AttendanceStatus,
    })
    attendanceStatus: AttendanceStatus;
    @ApiProperty({
        description: 'The professor of the participant',
        type: ProfessorDto,
    })
    professor: ProfessorDto;
}

export class VerifyParticipantSuccessResponseDto {
    @ApiProperty({
        description: 'The training to which the participant is associated.',
        type: TrainingDto,
    })
    training: TrainingDto;
    @ApiProperty({
        description: 'The executions of the training.',
        type: ExecutionDto,
        isArray: true,
    })
    executions: ExecutionDto[];
    @ApiProperty({
        description: 'The participant of the training.',
        type: ParticipantDto,
    })
    participant: ParticipantDto;
}

export class VerifyParticipantErrorResponseDto {
    @ApiProperty({
        description: 'The error code.',
        example: ERROR_CODES.QR_CODE_NOT_FOUND,
        enum: ERROR_CODES,
    })
    code: ERROR_CODES;
    @ApiProperty({
        description: 'The error message.',
        example: 'The QR code is not valid.',
    })
    message: string;
}