import { ParticipantRow, MigrationDocumentType, MigrationEmploymentType, BooleanResponse } from '../types/training-migration.types';

export function validateParticipantRow(participantRow: ParticipantRow) {
    const {
        asistencia,
        email,
        escuela,
        nombre,
        // roles,
        // "numero de documento": documentNumber,
        "tipo de documento": documentType,
        "tipo de empleo": employmentType,
        pais,
        "interesa reporteria": interesaReporteria,
    } = participantRow;

    if (!Object.keys(BooleanResponse).includes(asistencia)) {
        throw new Error('El campo "asistencia" tiene un valor inválido');
    }
    if (interesaReporteria && !Object.keys(BooleanResponse).includes(interesaReporteria)) {
        throw new Error('El campo "interesa reporteria" tiene un valor inválido');
    }
    if (!email) {
        throw new Error('El campo "email" es requerido');
    }
    if (!escuela) {
        throw new Error('El campo "escuela" es requerido');
    }
    if (!nombre) {
        throw new Error('El campo "nombre" es requerido');
    }
    // if (!documentNumber) {
    //     throw new Error('El campo "numero de documento" es requerido');
    // }
    // if (!documentType) {
    //     throw new Error('El campo "tipo de documento" es requerido');
    // }
    if(documentType && !Object.values(MigrationDocumentType).includes(documentType as MigrationDocumentType)){
        throw new Error('El campo "tipo de documento" tiene un valor inválido');
    }
    // if (!employmentType) {
    //     throw new Error('El campo "tipo de empleo" es requerido');
    // }
    if(employmentType && !Object.values(MigrationEmploymentType).includes(employmentType as MigrationEmploymentType)){
        throw new Error('El campo "tipo de empleo" tiene un valor inválido');
    }
    if(!pais){
        participantRow.pais = 'PE';
    }
    return participantRow;
}