export interface TrainingRow{
    "codigo": string;
    "nombre": string;
    semestre: string;
    "descripcion": string;
    tipo: MigrationTrainingType;
    "escuela": string;
    "modalidad": MigrationTrainingModality;
    "capacidad": string;
    "competencia": string;
    "fondo de certificado": string;
    "firma de certificado": string;
    "fecha de emision": string;
    "organizador en certificado": string;
    "desde": string;
    "hasta": string;
}

export enum MigrationTrainingModality {
    PRESENCIAL = 'PRESENCIAL',
    VIRTUAL = 'VIRTUAL',
    SEMIPRESENCIAL = 'SEMIPRESENCIAL',
}

export enum MigrationTrainingType {
    EXTRA = 'EXTRA',
    PROGRAMADO = 'PROGRAMADO',
}

export enum BooleanResponse{
    SI = 'SI',
    NO = 'NO',
}

export enum MigrationTrainingRole {
    ASISTENTE = 'ASISTENTE',
    ORGANIZADOR = 'ORGANIZADOR',
    PONENTE = 'PONENTE',
}

export enum MigrationEmploymentType {
    FULLTIME = 'PARTTIME',
    PARTTIME = 'FULLTIME',
}

export enum MigrationDocumentType {
    DNI = 'DNI',
    CE = 'CE',
    PASAPORTE = 'PASAPORTE',
}
export interface ParticipantRow{
    nombre: string;
    email: string;
    "tipo de documento": MigrationDocumentType;
    "numero de documento": string;
    "escuela": string;
    'tipo de empleo': MigrationEmploymentType;
    asistencia: BooleanResponse;
    roles: string;
    pais: string;
    "interesa reporteria": BooleanResponse;
}