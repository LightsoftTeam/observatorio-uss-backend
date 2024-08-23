import { Injectable } from '@nestjs/common';
import { ApplicationLoggerService } from 'src/common/services/application-logger.service';
import * as XLSX from 'xlsx';
import { ParticipantRow, TrainingRow } from '../types/training-migration.types';
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

@Injectable()
export class MigrationService {

  constructor(
    private readonly logger: ApplicationLoggerService,
    private readonly semestersService: SemestersService,
    private readonly competenciesService: CompetenciesService,
    private readonly schoolsService: SchoolsService,
    private readonly professorsService: ProfessorsService,
    private readonly participantsService: ParticipantsService,
    @InjectModel(Training)
    private readonly trainingContainer: Container,
    @InjectModel(Professor)
    private readonly professorsContainer: Container,
  ) { }

  async migrateFromExcel(file: Express.Multer.File) {
    this.logger.debug('Migrating training data from excel file');
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    this.logger.debug('Getting sheets');
    const [trainingDataSheetName, ...participantsSheetNames] = workbook.SheetNames;
    const trainingSheet = workbook.Sheets[trainingDataSheetName];
    const trainingData: TrainingRow[] = XLSX.utils.sheet_to_json(trainingSheet);
    this.logger.debug('Initializing migration');
    for (const trainingDataRow of trainingData) {
      this.logger.debug(`Initializing training migration`);
      const training = await this.importTraining(trainingDataRow);
      this.logger.debug(`Searching participants sheet for training ${trainingDataRow.codigo}`);
      const participantsSheetName = participantsSheetNames.find(name => name.includes(trainingDataRow.codigo));
      if (!participantsSheetName) {
        this.logger.debug(`No participants sheet found for training ${trainingDataRow.codigo}`);
        continue;
      }
      const participantsSheet = workbook.Sheets[participantsSheetName];
      const participantRows: ParticipantRow[] = XLSX.utils.sheet_to_json(participantsSheet);
      this.logger.debug(`Adding participants to training - ${participantRows.length} participants`);
      await this.addParticipantsToTraining({training, participantRows});
    }

    console.log(trainingData);

    return { message: 'Datos cargados exitosamente' };
  }

  async importTraining(trainingDataRow: TrainingRow) {
    // const errors = this.validateRow(trainingDataRow);
    // if(errors.le) 
    this.logger.debug(`Importing row: ${JSON.stringify(trainingDataRow)}`);
    const { 
      capacidad: capacityString,
      desde: fromDatePeru,
      hasta: toDatePeru,
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
    } = trainingDataRow;
    const capacity = capacityString ? parseInt(capacityString) : 0;
    const fromDate = DateTime.fromFormat(fromDatePeru, 'dd/MM/yyyy HH:mm:ss').plus({ hours: 5 }).toISODate();
    const toDate = DateTime.fromFormat(toDatePeru, 'dd/MM/yyyy HH:mm:ss').plus({ hours: 5 }).toISODate();
    const certificateEmisionDate = certificateEmisionDatePeru ? DateTime.fromFormat(trainingDataRow['fecha de emision'], 'dd/MM/yyyy HH:mm:ss').plus({ hours: 5 }).toISODate() : undefined;
    this.logger.debug(`Searching foreigns`);
    let [semester, competency, school] = await Promise.all([
      this.semestersService.getByName(semesterName),
      this.competenciesService.getByName(competencyName),
      this.schoolsService.getByName(organizerName),
    ]);
    if (!semester) {
      this.logger.debug(`Semester with name ${trainingDataRow.semestre} not found. Creating new semester`);
      semester = await this.semestersService.create({ name: trainingDataRow.semestre });
    }
    if (!competency) {
      this.logger.debug(`Competency with name ${trainingDataRow.competencia} not found. Creating new competency`);
      competency = await this.competenciesService.create({ name: trainingDataRow.competencia });
    }
    if (!school) {
      this.logger.debug(`School with name ${trainingDataRow.organizador} not found. Creating new school`);
      school = await this.schoolsService.create({ name: trainingDataRow.organizador });
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
    const {resource: training} = await this.trainingContainer.items.create(trainingPayload);
    return training;
  }

  async addParticipantsToTraining({training, participantRows}: {training: Training, participantRows: ParticipantRow[]}){
    if(participantRows.length === 0){
      this.logger.debug(`No participants to add`);
      return [];
    };
    for (const participantRow of participantRows) {
      const {
        nombre: name,
        email,
        'tipo de documento': documentType,
        'numero de documento': documentNumber,
        escuela: schoolName,
        'tipo de empleo': employmentType,
        asistencia: isAttended,
        roles: rolesInput,
      } = participantRow;
      const roles = rolesInput.split(',').map(role => role.trim())
        .filter(role => ["ASISTENTE", "PONENTE", "ORGANIZADOR"].includes(role.toUpperCase()))
        .map(role => {
          switch (role.toUpperCase()) {
            case "ASISTENTE":
              return TrainingRole.ASSISTANT;
            case "PONENTE":
              return TrainingRole.SPEAKER;
            case "ORGANIZADOR":
              return TrainingRole.ORGANIZER;
          }
        });
      if(roles.length === 0) roles.push(TrainingRole.ASSISTANT);
      let professor = await this.professorsService.getByDocument({documentNumber, documentType: DocumentType[documentType]});
      const attendanceStatus = isAttended.toUpperCase().trim() === 'SI' ? AttendanceStatus.ATTENDED : AttendanceStatus.PENDING;
      if(!professor){
        this.logger.debug(`Professor with document ${documentNumber} not found. Creating new professor`);
        let school = await this.schoolsService.getByName(schoolName);
        if(!school){
          this.logger.debug(`School with name ${schoolName} not found. Creating new school`);
          school = await this.schoolsService.create({name: schoolName});
        }
        const professorPayload: Professor = {
          name,
          email,
          documentType: DocumentType[documentType],
          documentNumber,
          schoolId: school.name,
          employmentType: EmploymentType[employmentType],
          createdAt: new Date(),
        }
        const {resource} = await this.professorsContainer.items.create(professorPayload);
        professor = resource;
      }
      const participant = {
        id: uuidv4(),
        roles,
        attendanceStatus,
        certificates: [],
        foreignId: professor.id,
      };
      if(attendanceStatus === AttendanceStatus.ATTENDED){
        participant.certificates = await this.participantsService.generateCertificates({training, participant});
      }
      training.participants.push(participant);
    }
  }
}
