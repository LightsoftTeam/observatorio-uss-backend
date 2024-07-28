import fs from 'fs';
import { InjectModel } from '@nestjs/azure-database';
import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import type { Container } from '@azure/cosmos';
import { AttendanceStatus, ExecutionAttendance, Training, TrainingCertificate, TrainingParticipant, TrainingRole } from '../entities/training.entity';
import { ApplicationLoggerService } from 'src/common/services/application-logger.service';
import { ProfessorsService } from 'src/professors/professors.service';
import { AddParticipantDto } from '../dto/add-participant.dto';
import { TrainingService } from '../training.service';
import { isUUID } from 'class-validator';
import { v4 as uuidv4 } from 'uuid';
import { UpdateParticipantDto } from '../dto/update-participant.dto';
import { AddAttendanceToExecutionDto } from '../dto/add-attendance-to-execution.dto';
import { TrainingCertificateTemplateData, getTrainingCertificateTemplate } from '../templates/training-certificate';
import { TrainingParticipantQrTemplateData, getParticipantQrTemplate } from '../templates/participant-qr';
import nodeHtmlToImage from 'node-html-to-image';
import { StorageService } from 'src/storage/storage.service';
import { CertificatesHelper } from 'src/common/helpers/certificates.helper';
import { ERROR_CODES, ERRORS } from '../constants/errors.constants';
const HTML_TO_PDF = require('html-pdf-node');



@Injectable()
export class ParticipantsService {

    constructor(
        @InjectModel(Training)
        private readonly trainingContainer: Container,
        private readonly logger: ApplicationLoggerService,
        private readonly professorService: ProfessorsService,
        private readonly trainingService: TrainingService,
        private readonly storageService: StorageService,
    ) {
        this.logger.setContext(ParticipantsService.name);
    }

    async findByTrainingId(trainingId: string) {
        try {
            const training = await this.trainingService.getTrainingById(trainingId);
            if (!training) {
                throw new NotFoundException('Training not found');
            }
            const trainingExecutions = training.executions;
            const participants = training.participants;
            return Promise.all(participants.map(async (participant) => {
                const fillParticipant = await this.fillParticipant(participant);
                console.log({
                    trainingExecutions
                })
                return {
                    ...fillParticipant,
                    executions: trainingExecutions.map((execution) => ({
                        id: execution.id,
                        from: execution.from,
                        to: execution.to,
                        participantAttend: !!execution.attendance.find((attendance) => attendance.participantId === participant.id),
                    })),
                }
            }));
        } catch (error) {
            this.logger.error(`findByTrainingId ${error.message}`);
            throw error;
        }
    }

    async addParticipant(trainingId: string, addParticipantDto: AddParticipantDto) {
        try {
            this.logger.log(`Adding professor ${addParticipantDto.professorId} to training ${trainingId}`);
            const training = await this.trainingService.getTrainingById(trainingId);
            if (!training) {
                this.logger.error(`Training ${trainingId} not found`);
                throw new NotFoundException('Training not found');
            }
            const { professorId, roles } = addParticipantDto;
            if (!isUUID(professorId)) {
                throw new BadRequestException('The professorId must be a valid UUID.');
            }
            //TODO: validate that professorId exists in the database
            const participant = training.participants.find((participant) => participant.foreignId === professorId);
            if (participant) {
                return this.fillParticipant(participant);
            }
            this.validateMultipleRoles(roles);
            training.participants.push({
                id: uuidv4(),
                foreignId: professorId,
                roles,
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
            const { roles, attendanceStatus } = updateParticipantDto;
            if (roles) {
                this.validateMultipleRoles(roles);
                participant.roles = roles;
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
    
    private validateMultipleRoles(roles: TrainingRole[]) {
        if (roles.length > 1 && !roles.includes(TrainingRole.ORGANIZER)) {
            throw new BadRequestException(ERRORS[ERROR_CODES.MULTIPLE_ROLES_NOT_ALLOWED]);
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
            const training = await this.getTrainingByParticipantId(participantId);
            if (!training) {
                throw new BadRequestException(ERRORS[ERROR_CODES.QR_CODE_NOT_FOUND]);
            }
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

    async getTrainingByParticipantId(participantId: string): Promise<Training | null> {
        const querySpec = {
            query: `SELECT value c from c join p in c.participants where p.id = @participantId`,
            parameters: [
                { name: '@participantId', value: participantId },
            ],
        }
        const { resources } = await this.trainingContainer.items.query<Training>(querySpec).fetchAll();
        if (resources.length === 0) {
            return null;
        }
        this.logger.log(`Participant ${participantId} found`);
        return resources[0];
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
                status: status ?? AttendanceStatus.ATTENDED,
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

    async completeTraining(participantId: string) {
        this.logger.log(`Completing training for participant ${participantId}`);
        try {
            this.logger.log(`Changing status of participant ${participantId}`);
            const training = await this.getTrainingByParticipantId(participantId);
            if (!training) {
                throw new NotFoundException('Training not found');
            }
            this.logger.log(`Training ${training.id} found`);
            const participant = training.participants.find((participant) => participant.id === participantId);
            participant.attendanceStatus = AttendanceStatus.ATTENDED;
            await this.trainingContainer.item(training.id, training.id).replace(training);
            const executions = training.executions;
            if (executions.length === 0) {
                throw new BadRequestException(ERRORS[ERROR_CODES.TRAINING_NOT_HAVE_EXECUTIONS]);
            }
            const certificate = await this.generateCertificate({
                training,
                participant,
            });
            participant.certificate = certificate;
            await this.trainingContainer.item(training.id, training.id).replace(training);
            return participant;
        } catch (error) {
            this.logger.error(`changeStatus ${error.message}`);
            throw new InternalServerErrorException(error.message);
        }
    }

    private async generateCertificate({ training, participant }: { training: Training, participant: TrainingParticipant }) {
        this.logger.log(`Generating certificate for participant ${participant.id}`);
        const { executions, name: trainingName } = training;
        const trainingFromDate = executions[0].from;
        const trainingToDate = executions[executions.length - 1].to;
        const emisionDate = new Date().toISOString();
        const durationinMiliseconds = executions.reduce((acc, execution) => {
            const from = new Date(execution.from);
            const to = new Date(execution.to);
            acc += to.getTime() - from.getTime();
            return acc;
        }, 0);
        const durationInHours = durationinMiliseconds / 1000 / 60 / 60;
        const filledParticipant = await this.fillParticipant(participant);
        const { id, professor, roles } = filledParticipant;
        const { name } = professor;
        const data: TrainingCertificateTemplateData = {
            id,
            name,
            roles,
            trainingName,
            emisionDate,
            trainingFromDate,
            trainingToDate,
            duration: durationInHours,
        };
        const certificate: TrainingCertificate = {
            id: uuidv4(),
            name,
            trainingName,
            duration: durationInHours,
            emisionDate,
            trainingFromDate,
            trainingToDate,
        }
        this.logger.log(`Certificate: ${JSON.stringify(certificate)}`)
        const html = getTrainingCertificateTemplate(data);
        const buffer: Buffer = await this.getPdfBuffer(html);
        this.logger.log(`Buffer ${buffer.length}`)
        const { blobUrl } = await this.storageService.uploadMessageMedia({
            buffer,
            blobName: CertificatesHelper.getBlobName(certificate.id),
            contentType: 'application/pdf',
        });
        certificate.url = blobUrl;
        return certificate;
    }

    async getCertificate(participantId: string) {
        // const training = await this.getTrainingByParticipantId(participantId);
        // if (!training) {
        //     throw new BadRequestException(ERRORS[ERROR_CODES.PARTICIPANT_NOT_FOUND]);
        // }
        // const participant = training.participants.find((participant) => participant.id === participantId);
        // //TODO: validate that the training is completed and set certificate status
        // const filledParticipant = await this.fillParticipant(participant);
        // if (participant.attendanceStatus !== AttendanceStatus.ATTENDED || !participant.certificate) {
        //     throw new BadRequestException(ERRORS[ERROR_CODES.TRAINING_NOT_COMPLETED]);
        // }
        // const { name: trainingName } = training;
        // const { id, professor, role, certificate } = filledParticipant;
        // const { name } = professor;
        // const data: TrainingCertificateTemplateData = {
        //     id,
        //     name,
        //     role,
        //     trainingName,
        //     emisionDate: participant.certificate.emisionDate,
        //     trainingFromDate: participant.certificate.trainingFromDate,
        //     trainingToDate: participant.certificate.trainingToDate,
        //     duration: participant.certificate.duration,
        // };
        // const html = getTrainingCertificateTemplate(data);
        // const buffer: Buffer = await this.getPdfBuffer(html);
        // const { blobUrl } = await this.storageService.uploadMessageMedia({
        //     buffer,
        //     blobName: CertificatesHelper.getBlobName(certificate.id),
        //     contentType: 'application/pdf',
        // });
        return participantId;
    }

    async getParticipantQr(participantId: string) {
        try {
            this.logger.log(`Generating QR code for participant ${participantId}`);
            const training = await this.getTrainingByParticipantId(participantId);
            if (!training) {
                throw new BadRequestException(ERRORS[ERROR_CODES.PARTICIPANT_NOT_FOUND]);
            }
            const participant = training.participants.find((participant) => participant.id === participantId);
            const filledParticipant = await this.fillParticipant(participant);
            const { id, roles, professor } = filledParticipant;
            const { documentNumber, documentType, email, name } = professor;
            const data: TrainingParticipantQrTemplateData = {
                documentNumber,
                documentType,
                email,
                name,
                participantId: id,
                roles,
            }
            const html = getParticipantQrTemplate(data);
            const buffer = await nodeHtmlToImage({
                html,
                selector: '#content',
            });
            return buffer;
        } catch (error) {
            this.logger.error(`getParticipantQr ${error.message}`);
            throw error;
        }
    }

    async getPdfBuffer(html: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const logger = this.logger;
            // pdf.create(html).toBuffer(function (err: any, buffer: Buffer) {
            //     if(err){
            //         logger.error(`getPdfBuffer ${err.message}`);
            //         reject(err);
            //     }
            //     logger.log(`Buffer ${buffer.length}`)
            //     resolve(buffer);
            // });
            let options = { format: 'A4' };
            // Example of options with args //
            // let options = { format: 'A4', args: ['--no-sandbox', '--disable-setuid-sandbox'] };

            let file = { content: html };
            HTML_TO_PDF.generatePdf(file, options).then(pdfBuffer => {
                resolve(pdfBuffer);
            });
        });
    }
}
