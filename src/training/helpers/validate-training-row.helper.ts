import { MigrationTrainingModality, MigrationTrainingType, TrainingRow } from "../types/training-migration.types";

export function validateTrainingRow(trainingDataRow: TrainingRow) {
    const {
        codigo,
        nombre,
        capacidad,
        competencia,
        desde,
        hasta,
        modalidad,
        organizador,
        semestre,
        tipo,
        // "fecha de emision": emisionDate,
        // "organizador en certificado": certificateOrganizer,
        // "firma de certificado": certificateSignature,
        // "fondo de certificado": certificateBackground,
        // descripcion,
    } = trainingDataRow;

    if (!codigo) {
        throw new Error('El campo "codigo" es requerido');
    }
    if (!nombre) {
        throw new Error('El campo "nombre" es requerido');
    }
    if (!capacidad || isNaN(parseInt(capacidad))) {
        trainingDataRow.capacidad = '0';
    }
    if (!competencia) {
        throw new Error('El campo "competencia" es requerido');
    }
    if(!desde){
        throw new Error('El campo "desde" es requerido');
    }
    if(!hasta){
        throw new Error('El campo "hasta" es requerido');
    }
    if (!modalidad) {
        throw new Error('El campo "modalidad" es requerido');
    }
    if (!Object.values(MigrationTrainingModality).includes(modalidad as MigrationTrainingModality)) {
        throw new Error('El campo "modalidad" tiene un valor inválido');
    }
    if (!organizador) {
        throw new Error('El campo "organizador" es requerido');
    }
    if (!semestre) {
        throw new Error('El campo "semestre" es requerido');
    }
    if (!tipo) {
        throw new Error('El campo "tipo" es requerido');
    }
    if(!Object.values(MigrationTrainingType).includes(tipo as MigrationTrainingType)){
        throw new Error('El campo "tipo" tiene un valor inválido');
    }
    return trainingDataRow;
}