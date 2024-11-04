import { Injectable } from '@nestjs/common';
import { ApplicationLoggerService } from 'src/common/services/application-logger.service';
import { BooleanResponse, ParticipantRow, TrainingRow } from '../types/training-migration.types';
import { AttendanceStatus, Training, TrainingStatus } from '../entities/training.entity';
import { v4 as uuidv4 } from 'uuid';
import { SemestersService } from 'src/semesters/semesters.service';
import { CompetenciesService } from '../../competencies/competencies.service';
import { SchoolsService } from 'src/schools/schools.service';
import { InjectModel } from '@nestjs/azure-database';
import type { Container } from '@azure/cosmos';
import { ParticipantsService } from './participants.service';
import { validateTrainingRow } from '../helpers/validate-training-row.helper';
import { TrainingService } from '../training.service';
import { validateParticipantRow } from '../helpers/validate-participant-row.helper';
import { getIsoDateFromMigrationDate } from '../helpers/get-iso-date-from-migration-date.helper';
import { getDocumentType, getEmploymentType, getModality, getRoles, getTrainingType } from '../mappers/migration.mappers';
import { getFileInfo, getSheetRows } from '../helpers/sheets.helpers';
import { TrainingMigrationEvent, TrainingMigrationTrace } from '../entities/training-migration-event.entity';
import { UsersRepository } from 'src/repositories/services/users.repository';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { generateRandomPassword } from '../helpers/generate-random-password';
import { MailService } from 'src/common/services/mail.service';
import { Role } from 'src/users/entities/user.entity';

@Injectable()
export class MigrationService {

  constructor(
    private readonly logger: ApplicationLoggerService,
    private readonly semestersService: SemestersService,
    private readonly competenciesService: CompetenciesService,
    private readonly schoolsService: SchoolsService,
    private readonly participantsService: ParticipantsService,
    private readonly trainingService: TrainingService,
    @InjectModel(Training)
    private readonly trainingContainer: Container,
    @InjectModel(TrainingMigrationEvent)
    private readonly trainingMigrationContainer: Container,
    private readonly usersRepository: UsersRepository,
    private readonly mailService: MailService,
  ) { }

  async migrateFromExcel() {
    const trace: TrainingMigrationTrace[] = [];
    const { sheets, spreadsheetId, sheetNames } = await getFileInfo();
    const [trainingSheetName, ...participantsSheetNames] = sheetNames;
    const trainingRows = await getSheetRows<TrainingRow>({ sheets, spreadsheetId, sheetName: trainingSheetName });
    this.logger.debug('Initializing migration');
    for (const trainingDataRow of trainingRows) {
      this.logger.debug(`Initializing training migration`);
      let training: Training;
      try {
        training = await this.importTraining(trainingDataRow);
        trace.push({
          isSuccessful: true,
          message: `Capacitación ${trainingDataRow.codigo} importada satisfactoriamente`,
        });
      } catch (error) {
        trace.push({
          isSuccessful: false,
          message: error.message,
        })
        continue;
      }
      this.logger.debug(`Searching participants sheet for training ${trainingDataRow.codigo}`);
      const participantRows: ParticipantRow[] = await getSheetRows<ParticipantRow>({ sheets, spreadsheetId, sheetName: participantsSheetNames.find(name => name.includes(trainingDataRow.codigo)) });
      this.logger.debug(`Adding participants to training - ${participantRows.length} participants`);
      for (const participantRow of participantRows) {
        try {
          await this.addParticipantToTraining({ training, participantRow });
          trace.push({
            isSuccessful: true,
            message: `Participante ${participantRow.nombre} importado satisfactoriamente en capacitación ${trainingDataRow.codigo}`,
          });
        } catch (error) {
          trace.push({
            isSuccessful: false,
            message: `Participante ${participantRow.nombre} no importado: ${error.message} en capacitación ${trainingDataRow.codigo}`,
          });
          continue;
        }
      }
    }
    const resume: TrainingMigrationEvent = {
      sheetNames,
      trace,
      createdAt: new Date(),
    }
    this.trainingMigrationContainer.items.create(resume);
    return { trace };
  }

  async importTraining(trainingRow: TrainingRow) {
    try {
      this.logger.debug(`Importing row: ${JSON.stringify(trainingRow)}`);
      const data = validateTrainingRow(trainingRow);
      const {
        capacidad: capacityString,
        desde: fromDate,
        hasta: toDate,
        codigo: code,
        competencia: competencyName,
        modalidad: modality,
        nombre: name,
        escuela: escuelaName,
        semestre: semesterName,
        tipo: type,
        descripcion: description,
        'fondo de certificado': certificateBackgroundUrl,
        "fecha de emision": certificateEmisionDatePeru,
        "organizador en certificado": certificateOrganizer,
        "firma de certificado": certificateSignatureUrl,
      } = data;
      const existingTraining = await this.trainingService.getByCode(code);
      if (existingTraining) {
        throw new Error(`La capacitación ya existe`);
      }
      this.logger.debug(`Formatting training type`);
      let formattedType = getTrainingType(type);
      this.logger.debug(`Formatting training modality`);
      let formattedModality = getModality(modality);
      this.logger.debug(`Parsing capacity`);
      const capacity = parseInt(capacityString);
      const certificateEmisionDate = certificateEmisionDatePeru ? getIsoDateFromMigrationDate(certificateEmisionDatePeru) : undefined;
      this.logger.debug(`Searching foreigns`);
      let [semester, competency, school] = await Promise.all([
        this.semestersService.getByName(semesterName),
        this.competenciesService.getByName(competencyName),
        this.schoolsService.getByName(escuelaName),
      ]);
      if (!semester) {
        this.logger.debug(`Semester with name ${data.semestre} not found. Creating new semester`);
        semester = await this.semestersService.create({ name: data.semestre });
      }
      if (!competency) {
        this.logger.debug(`Competency with name ${data.competencia} not found. Creating new competency`);
        competency = await this.competenciesService.create({ name: data.competencia });
      }
      if (!school) {
        this.logger.debug(`School with name ${escuelaName} not found. Creating new school`);
        school = await this.schoolsService.create({ name: escuelaName });
      }
      const trainingPayload: Training = {
        code,
        modality: formattedModality,
        name,
        organizer: school.id,
        participants: [],
        semesterId: semester.id,
        status: TrainingStatus.ACTIVE,
        type: formattedType,
        executions: [{
          id: uuidv4(),
          attendance: [],
          from: getIsoDateFromMigrationDate(fromDate),
          to: getIsoDateFromMigrationDate(toDate),
        }],
        competencyId: competency.id,
        description,
        certificateBackgroundUrl,
        certificateEmisionDate,
        certificateOrganizer,
        certificateSignatureUrl,
        capacity,
        createdAt: new Date(),
      }
      const { resource: training } = await this.trainingContainer.items.create(trainingPayload);
      return training;
    } catch (error) {
      this.logger.error(`Error importing training ${trainingRow.codigo}: ${error.message}`);
      throw error;
    }
  }

  async addParticipantToTraining({ training, participantRow }: { training: Training, participantRow: ParticipantRow }) {
    try {
      const data = validateParticipantRow(participantRow);
      const {
        nombre: name,
        email,
        'tipo de documento': documentType,
        'numero de documento': documentNumber,
        escuela: schoolName,
        'tipo de empleo': employmentType,
        asistencia: isAttended,
        roles: rolesInput,
        pais: countryCode,
        'interesa reporteria': interesaReporteria,
      } = data;
      const roles = getRoles(rolesInput);
      let formattedDocumentType = getDocumentType(documentType);
      this.logger.debug(`Searching professor with document ${formattedDocumentType} ${documentNumber}`);
      let professor = await this.usersRepository.getByDocument({ documentNumber, documentType: formattedDocumentType });
      const attendanceStatus = isAttended.toUpperCase().trim() === BooleanResponse.SI ? AttendanceStatus.ATTENDED : AttendanceStatus.PENDING;
      if (!professor) {
        this.logger.debug(`Professor with document ${documentNumber} not found. Creating new professor`);
        let school = await this.schoolsService.getByName(schoolName);
        if (!school) {
          this.logger.debug(`School with name ${schoolName} not found. Creating new school`);
          school = await this.schoolsService.create({ name: schoolName });
        }
        let formattedEmploymentType = getEmploymentType(employmentType);
        const professorPayload: CreateUserDto = {
          name,
          email,
          role: Role.PROFESSOR,
          documentType: formattedDocumentType,
          documentNumber,
          schoolId: school.name,
          employmentType: formattedEmploymentType,
          countryCode,
          password: generateRandomPassword(),
          excludedFromReports: interesaReporteria === BooleanResponse.SI ? undefined : true,
        }
        professor = await this.usersRepository.create(professorPayload);
        this.mailService.sendNewAccountWithPassword({ user: professor, password: professorPayload.password });
      }
      const participant = {
        id: uuidv4(),
        roles,
        attendanceStatus,
        certificates: [],
        foreignId: professor.id,
      };
      if (attendanceStatus === AttendanceStatus.ATTENDED) {
        participant.certificates = await this.participantsService.generateCertificates({ training, participant });
        training.executions[0].attendance.push({
          id: uuidv4(),
          participantId: participant.id,
          status: AttendanceStatus.ATTENDED,
          createdAt: new Date().toISOString(),
        });
      }
      training.participants.push(participant);
      await this.trainingContainer.item(training.id, training.id).replace(training);
    } catch (error) {
      this.logger.error(`Error adding participant ${participantRow.nombre} to training ${training.code}: ${error.message}`);
      throw new Error(`Ocurrió un error inesperado`);
    }
  }
}
