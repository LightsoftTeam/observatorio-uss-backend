import { Injectable } from '@nestjs/common';
import { ApplicationLoggerService } from 'src/common/services/application-logger.service';
import * as XLSX from 'xlsx';
import { BooleanResponse, MigrationDocumentType, MigrationEmploymentType, MigrationTrainingRole, ParticipantRow, TrainingRow } from '../types/training-migration.types';
import { AttendanceStatus, Training, TrainingModality, TrainingRole, TrainingStatus, TrainingType } from '../entities/training.entity';
import { DateTime } from 'luxon';
import { v4 as uuidv4 } from 'uuid';
import { SemestersService } from 'src/semesters/semesters.service';
import { CompetenciesService } from '../../competencies/competencies.service';
import { SchoolsService } from 'src/schools/schools.service';
import { InjectModel } from '@nestjs/azure-database';
import type { Container } from '@azure/cosmos';
import { ProfessorsService } from 'src/professors/professors.service';
import { DocumentType } from 'src/common/types/document-type.enum';
import { EmploymentType, Professor } from 'src/professors/entities/professor.entity';
import { ParticipantsService } from './participants.service';
import { validateTrainingRow } from '../helpers/validate-training-row.helper';
import { TrainingService } from '../training.service';
import { validateParticipantRow } from '../helpers/validate-participant-row.helper';

@Injectable()
export class MigrationService {

  constructor(
    private readonly logger: ApplicationLoggerService,
    private readonly semestersService: SemestersService,
    private readonly competenciesService: CompetenciesService,
    private readonly schoolsService: SchoolsService,
    private readonly professorsService: ProfessorsService,
    private readonly participantsService: ParticipantsService,
    private readonly trainingService: TrainingService,
    @InjectModel(Training)
    private readonly trainingContainer: Container,
    @InjectModel(Professor)
    private readonly professorsContainer: Container,
  ) { }

  async migrateFromExcel(file: Express.Multer.File) {
    const trace: { ok: boolean, message: string }[] = [];
    this.logger.debug('Migrating training data from excel file');
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    this.logger.debug('Getting sheets');
    const [trainingDataSheetName, ...participantsSheetNames] = workbook.SheetNames;
    const trainingSheet = workbook.Sheets[trainingDataSheetName];
    const trainingData: TrainingRow[] = XLSX.utils.sheet_to_json(trainingSheet);
    this.logger.debug('Initializing migration');
    for (const trainingDataRow of trainingData) {
      this.logger.debug(`Initializing training migration`);
      let training: Training;
      try {
        training = await this.importTraining(trainingDataRow);
        trace.push({
          ok: true,
          message: `Capacitación ${trainingDataRow.codigo} importada satisfactoriamente`,
        });
      } catch (error) {
        trace.push({
          ok: false,
          message: error.message,
        })
        continue;
      }
      this.logger.debug(`Searching participants sheet for training ${trainingDataRow.codigo}`);
      const participantsSheetName = participantsSheetNames.find(name => name.includes(trainingDataRow.codigo));
      if (!participantsSheetName) {
        this.logger.debug(`No participants sheet found for training ${trainingDataRow.codigo}`);
        continue;
      }
      const participantsSheet = workbook.Sheets[participantsSheetName];
      const participantRows: ParticipantRow[] = XLSX.utils.sheet_to_json(participantsSheet);
      this.logger.debug(`Adding participants to training - ${participantRows.length} participants`);
      for (const participantRow of participantRows) {
        try {
          await this.addParticipantToTraining({ training, participantRow });
          trace.push({
            ok: true,
            message: `Participante ${participantRow.nombre} importado satisfactoriamente`,
          });
        } catch (error) {
          trace.push({
            ok: false,
            message: error.message,
          });
          continue;
        }
      }
    }

    console.log(trainingData);

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
        organizador: organizerName,
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
      const capacity = parseInt(capacityString);
      const certificateEmisionDate = certificateEmisionDatePeru ? DateTime.fromFormat(data['fecha de emision'], 'dd/MM/yyyy HH:mm:ss').plus({ hours: 5 }).toISODate() : undefined;
      this.logger.debug(`Searching foreigns`);
      let [semester, competency, school] = await Promise.all([
        this.semestersService.getByName(semesterName),
        this.competenciesService.getByName(competencyName),
        this.schoolsService.getByName(organizerName),
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
        this.logger.debug(`School with name ${data.organizador} not found. Creating new school`);
        school = await this.schoolsService.create({ name: data.organizador });
      }
      const trainingPayload: Training = {
        code,
        modality: TrainingModality[modality],
        name,
        organizer: school.id,
        participants: [],
        semesterId: semester.id,
        status: TrainingStatus.ACTIVE,
        type: TrainingType[type],
        executions: [{
          id: uuidv4(),
          attendance: [],
          from: fromDate,
          to: toDate,
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
      throw new Error(`Ocurrió un error inesperado`);
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
      } = data;
      const roles = rolesInput.split(',').map(role => role.trim().toUpperCase())
        .filter(role => Object.keys(MigrationTrainingRole).includes(role.toUpperCase()))
        .map(role => {
          switch (role.toUpperCase()) {
            case MigrationTrainingRole.ASISTENTE:
              return TrainingRole.ASSISTANT;
            case MigrationTrainingRole.PONENTE:
              return TrainingRole.SPEAKER;
            case MigrationTrainingRole.ORGANIZADOR:
              return TrainingRole.ORGANIZER;
          }
        });
      if (roles.length === 0) roles.push(TrainingRole.ASSISTANT);
      let formattedDocumentType: DocumentType;
      switch (documentType) {
        case MigrationDocumentType.DNI:
          formattedDocumentType = DocumentType.DNI;
          break;
        case MigrationDocumentType.CE:
          formattedDocumentType = DocumentType.CARNET_EXTRANJERIA;
          break;
        case MigrationDocumentType.PASAPORTE:
          formattedDocumentType = DocumentType.PASAPORTE;
          break;
        default:
          throw new Error('Tipo de documento inválido');
      }
      let professor = await this.professorsService.getByDocument({ documentNumber, documentType: formattedDocumentType });
      const attendanceStatus = isAttended.toUpperCase().trim() === BooleanResponse.SI ? AttendanceStatus.ATTENDED : AttendanceStatus.PENDING;
      if (!professor) {
        this.logger.debug(`Professor with document ${documentNumber} not found. Creating new professor`);
        let school = await this.schoolsService.getByName(schoolName);
        if (!school) {
          this.logger.debug(`School with name ${schoolName} not found. Creating new school`);
          school = await this.schoolsService.create({ name: schoolName });
        }
        let formattedEmploymentType: EmploymentType;
        switch (employmentType) {
          case MigrationEmploymentType.PARTTIME:
            formattedEmploymentType = EmploymentType.PART_TIME;
            break;
          case MigrationEmploymentType.FULLTIME:
            formattedEmploymentType = EmploymentType.FULL_TIME;
            break;
          default:
            throw new Error('Tipo de empleo inválido');
        }
        const professorPayload: Professor = {
          name,
          email,
          documentType: formattedDocumentType,
          documentNumber,
          schoolId: school.name,
          employmentType: formattedEmploymentType,
          createdAt: new Date(),
        }
        const { resource } = await this.professorsContainer.items.create(professorPayload);
        professor = resource;
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
      }
      training.participants.push(participant);
    } catch (error) {
      this.logger.error(`Error adding participant ${participantRow.nombre} to training ${training.code}: ${error.message}`);
      throw new Error(`Ocurrió un error inesperado`);
    }
  }
}
