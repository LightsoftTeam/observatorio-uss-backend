import { CosmosDateTime, CosmosPartitionKey } from "@nestjs/azure-database";

export interface ExecutionAttendance {
    id: string;
    participantId: string;
    status: AttendanceStatus;
    createdAt: string;
}

export interface Execution {
    id: string;
    from: string;
    to: string;
    attendance: ExecutionAttendance[];
}

export interface TrainingParticipant {
    id: string;
    foreignId: string;
    role: TrainingRole;
    attendanceStatus: AttendanceStatus;
}

export enum AttendanceStatus {
    PENDING = 'pending',
    PRESENT = 'present',
    LATE = 'late',
}

export enum TrainingRole {
    ASSISTANT = 'assistant',
    ORGANIZER = 'organizer',
    SPEAKER = 'speaker',
}

export enum TrainingStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
}

export enum TrainingModality {
    PRESENTIAL = 'presential',
    VIRTUAL = 'virtual',
    SEMIPRESENTIAL = 'semipresential',
}

@CosmosPartitionKey('id')
export class Training {
    id?: string;
    code: string;
    name: string;
    description?: string;
    executions: Execution[];
    place?: string;
    floor?: number;
    building?: string;
    organizer: 'DDA' | string;
    status: TrainingStatus;
    modality: TrainingModality;
    capacity: number;
    participants: TrainingParticipant[];
    @CosmosDateTime() createdAt: Date;
}
