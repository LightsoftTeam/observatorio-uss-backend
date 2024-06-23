import { InjectModel } from '@nestjs/azure-database';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Container } from '@azure/cosmos';
import { AttendanceStatus, ExecutionAttendance, Training, TrainingParticipant, TrainingRole } from '../entities/training.entity';
import { ApplicationLoggerService } from 'src/common/services/application-logger.service';
import { ProfessorsService } from 'src/professors/professors.service';
import { AddParticipantDto } from '../dto/add-participant.dto';
import { TrainingService } from '../training.service';
import { isUUID } from 'class-validator';
import { v4 as uuidv4 } from 'uuid';
import { UpdateParticipantDto } from '../dto/update-participant.dto';
import { AddAttendanceToExecutionDto } from '../dto/add-attendance-to-execution.dto';

export enum ERROR_CODES {
    QR_CODE_NOT_FOUND = 'QR_CODE_NOT_FOUND',
}

const ERRORS = {
    [ERROR_CODES.QR_CODE_NOT_FOUND]: {
        code: ERROR_CODES.QR_CODE_NOT_FOUND,
        message: 'The QR code is not valid.',
    },
}

@Injectable()
export class ParticipantsService {

    constructor(
        @InjectModel(Training)
        private readonly trainingContainer: Container,
        private readonly logger: ApplicationLoggerService,
        private readonly professorService: ProfessorsService,
        private readonly trainingService: TrainingService,
    ) {
        this.logger.setContext(ParticipantsService.name);
    }

    async addParticipant(trainingId: string, addParticipantDto: AddParticipantDto) {
        try {
            this.logger.log(`Adding professor ${addParticipantDto.professorId} to training ${trainingId}`);
            const training = await this.trainingService.getTrainingById(trainingId);
            if (!training) {
                this.logger.error(`Training ${trainingId} not found`);
                throw new NotFoundException('Training not found');
            }
            const { professorId, role } = addParticipantDto;
            if (!isUUID(professorId)) {
                throw new BadRequestException('The professorId must be a valid UUID.');
            }
            //TODO: validate that professorId exists in the database
            const participant = training.participants.find((participant) => participant.foreignId === professorId);
            if (participant) {
                throw new BadRequestException('The participant is already added to the training.');
            }
            training.participants.push({
                id: uuidv4(),
                foreignId: professorId,
                role: role ?? TrainingRole.ASSISTANT,
                attendanceStatus: AttendanceStatus.PENDING,
            });
            const { resource: trainingUpdated } = await this.trainingContainer.item(trainingId, trainingId).replace(training);
            const newParticipant = trainingUpdated.participants.find((participant) => participant.foreignId === professorId);
            return this.fillParticipant(newParticipant);
        } catch (error) {
            this.logger.error(`addParticipant ${error.message}`);
            throw error;
        }
    }

    async updateParticipant(trainingId: string, participantId: string, updateParticipantDto: UpdateParticipantDto) {
        try {
            this.logger.log(`Updating participant ${participantId} from training ${trainingId}, dto: ${JSON.stringify(updateParticipantDto)}`);
            const querySpec = {
                query: `SELECT value c from c join p in c.participants where p.id = @participantId`,
                parameters: [
                    { name: '@participantId', value: participantId },
                ],
            }
            const { resources } = await this.trainingContainer.items.query<Training>(querySpec).fetchAll();
            if (resources.length === 0) {
                throw new NotFoundException('Participant not found');
            }
            const training = resources[0];
            const participant = training.participants.find((participant) => participant.id === participantId);
            if (!participant) {
                throw new NotFoundException('Participant not found');
            }
            const { role, attendanceStatus } = updateParticipantDto;
            if (role) {
                participant.role = role;
            }
            if (attendanceStatus) {
                participant.attendanceStatus = attendanceStatus;
            }
            const { resource: trainingUpdated } = await this.trainingContainer.item(training.id, training.id).replace(training);
            const participantUpdated = trainingUpdated.participants.find((participant) => participant.id === participantId);
            return this.fillParticipant(participantUpdated);
        } catch (error) {
            this.logger.error(`updateParticipant ${error.message}`);
            throw error;
        }
    }

    async removeParticipant(trainingId: string, participantId: string) {
        try {
            this.logger.log(`Deleting participant ${participantId} from training ${trainingId}`);
            const training = await this.trainingService.getTrainingById(trainingId);
            if (!training) {
                throw new NotFoundException('Training not found');
            }
            const participant = training.participants.find((participant) => participant.id === participantId);
            if (!participant) {
                throw new NotFoundException('Participant not found');
            }
            const filteredParticipants = training.participants.filter((participant) => participant.id !== participantId);
            training.participants = filteredParticipants;
            try {
                await this.trainingContainer.item(trainingId, trainingId).replace(training);
                return null;
            } catch (error) {
                this.logger.error(`deleteParticipant ${error.message}`);
                throw new BadRequestException('Participant not found');
            }
        } catch (error) {
            this.logger.error(`removeParticipant ${error.message}`);
            throw error;
        }
    }

    private async fillParticipant(participant: TrainingParticipant) {
        this.logger.log(`Filling participant ${participant.id}`);
        const { foreignId } = participant;
        const professor = await this.professorService.findOne(foreignId);
        return {
            ...participant,
            professor,
        };
    }

    async verifyParticipant(participantId: string) {
        try {
            this.logger.log(`Verifying participant ${participantId}`);
            const querySpec = {
                query: `SELECT value c from c join p in c.participants where p.id = @participantId`,
                parameters: [
                    { name: '@participantId', value: participantId },
                ],
            }
            const { resources } = await this.trainingContainer.items.query<Training>(querySpec).fetchAll();
            if (resources.length === 0) {
                this.logger.log(`Participant ${participantId} not found`);
                throw new BadRequestException(ERRORS[ERROR_CODES.QR_CODE_NOT_FOUND]);
            }
            this.logger.log(`Participant ${participantId} found`);
            const training = resources[0];
            this.logger.log(`Training ${training.id} found`);
            const participant = training.participants.find((participant) => participant.id === participantId);
            if (!participant) {
                throw new BadRequestException(ERRORS[ERROR_CODES.QR_CODE_NOT_FOUND]);
            }
            const { id, name, code, modality, executions } = training;
            const filledParticipant = await this.fillParticipant(participant);
            return {
                training: {
                    id,
                    name,
                    code,
                    modality,
                },
                executions: executions.map((execution) => ({
                    id: execution.id,
                    from: execution.from,
                    to: execution.to,
                    participantAttend: !!execution.attendance.find((attendance) => attendance.participantId === participantId),
                })),
                participant: filledParticipant,
            }
        } catch (error) {
            this.logger.error(`verifyParticipant ${error.message}`);
            throw error;
        }
    }

    async addAttendanceToExecution(trainingId: string, executionId: string, addAttendanceToExecutionDto: AddAttendanceToExecutionDto) {
        try {
            this.logger.log(`Adding attendance to execution ${executionId} from training ${trainingId}`);
            const training = await this.trainingService.getTrainingById(trainingId);
            if (!training) {
                throw new NotFoundException('Training not found');
            }
            const execution = training.executions.find((execution) => execution.id === executionId);
            if (!execution) {
                throw new NotFoundException('Execution not found');
            }
            const { participantId, status } = addAttendanceToExecutionDto;
            const participant = training.participants.find((participant) => participant.id === participantId);
            if (!participant) {
                throw new NotFoundException('Participant not found');
            }
            const assistance = execution.attendance.find((assistance) => assistance.participantId === participantId);
            if (assistance) {
                throw new BadRequestException('The participant is already added to the execution.');
            }
            const attendance: ExecutionAttendance = {
                id: uuidv4(),
                participantId,
                status: status ?? AttendanceStatus.PRESENT,
                createdAt: new Date().toISOString(),
            }
            execution.attendance.push(attendance);
            await this.trainingContainer.item(trainingId, trainingId).replace(training);
            return attendance;
        } catch (error) {
            this.logger.error(`addAttendanceToExecution ${error.message}`);
            throw error;
        }
    }
}
