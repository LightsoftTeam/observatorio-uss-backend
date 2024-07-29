import { CosmosDateTime, CosmosPartitionKey } from "@nestjs/azure-database";
import { School } from "src/schools/entities/school.entity";

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
    place?: string;
    attendance: ExecutionAttendance[];
}

export interface TrainingCertificate {
    id: string;
    name: string;
    trainingName: string;
    emisionDate: string;
    trainingFromDate: string;
    trainingToDate: string;
    duration: number;
    url?: string;
}

export interface TrainingParticipant {
    id: string;
    foreignId: string;
    roles: TrainingRole[];
    attendanceStatus: AttendanceStatus;
    certificate?: TrainingCertificate;
}

export enum AttendanceStatus {
    PENDING = 'pending',
    ATTENDED = 'attended',
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
    organizer: 'DDA' | string | Partial<School>;
    status: TrainingStatus;
    modality: TrainingModality;
    capacity: number;
    participants: TrainingParticipant[];
    competencyId: string;
    @CosmosDateTime() createdAt: Date;
}
