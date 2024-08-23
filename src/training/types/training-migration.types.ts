export interface TrainingRow{
    "codigo": string;
    "nombre": string;
    semestre: string;
    tipo: string;
    "descripcion": string;
    "organizador": string;
    "modalidad": string;
    "capacidad": string;
    "competencia": string;
    "fondo de certificado": string;
    "firma de certificado": string;
    "fecha de emision": string;
    "organizador en certificado": string;
    "desde": string;
    "hasta": string;
}

export interface ParticipantRow{
    nombre: string;
    email: string;
    "tipo de documento": string;
    "numero de documento": string;
    "escuela": string;
    'tipo de empleo': string;
    asistencia: string;
    roles: string;
}