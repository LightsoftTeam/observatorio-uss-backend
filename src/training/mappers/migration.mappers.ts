import { DocumentType } from "src/common/types/document-type.enum";
import { TrainingModality, TrainingRole, TrainingType } from "../entities/training.entity";
import { MigrationDocumentType, MigrationEmploymentType, MigrationTrainingModality, MigrationTrainingRole, MigrationTrainingType } from "../types/training-migration.types";
import { EmploymentType } from "src/professors/entities/professor.entity";

export function getModality(migrationModality: MigrationTrainingModality): TrainingModality {
    const map = {
        [MigrationTrainingModality.PRESENCIAL]: TrainingModality.PRESENTIAL,
        [MigrationTrainingModality.VIRTUAL]: TrainingModality.VIRTUAL,
        [MigrationTrainingModality.SEMIPRESENCIAL]: TrainingModality.SEMIPRESENTIAL,
    };
    const modality = map[migrationModality];
    if (!modality) {
        throw new Error('Modalidad de capacitación inválida');
    }
    return modality;
}

export function getTrainingType(migrationType: MigrationTrainingType): TrainingType {
    const map = {
        [MigrationTrainingType.EXTRA]: TrainingType.EXTRA,
        [MigrationTrainingType.PROGRAMADO]: TrainingType.SCHEDULED,
    };
    const type = map[migrationType];
    if (!type) {
        throw new Error('Tipo de capacitación inválido');
    }
    return type;
}

export function getRoles(migrationRoles: string): TrainingRole[] {
    const map = {
        [MigrationTrainingRole.ASISTENTE]: TrainingRole.ASSISTANT,
        [MigrationTrainingRole.PONENTE]: TrainingRole.SPEAKER,
        [MigrationTrainingRole.ORGANIZADOR]: TrainingRole.ORGANIZER,
    };

    const roles = migrationRoles.split(',').map(role => role.trim().toUpperCase())
        .filter(role => Object.keys(MigrationTrainingRole).includes(role.toUpperCase()))
        .map(role => map[role]);
    if (roles.length === 0) roles.push(TrainingRole.ASSISTANT);
    return roles;
}

export function getDocumentType(migrationDocumentType: string): DocumentType {
    const map = {
        [MigrationDocumentType.DNI]: DocumentType.DNI,
        [MigrationDocumentType.CE]: DocumentType.CARNET_EXTRANJERIA,
        [MigrationDocumentType.PASAPORTE]: DocumentType.PASAPORTE,
    };
    const documentType = map[migrationDocumentType];
    if (!documentType) {
        throw new Error('Tipo de documento inválido');
    }
    return documentType;
}

export function getEmploymentType(migrationEmploymentType: MigrationEmploymentType): EmploymentType{
    const map = {
        [MigrationEmploymentType.PARTTIME]: EmploymentType.PART_TIME,
        [MigrationEmploymentType.FULLTIME]: EmploymentType.FULL_TIME,
    };
    const employmentType = map[migrationEmploymentType];
    if (!employmentType) {
        throw new Error('Tipo de empleo inválido');
    }
    return employmentType;
}