import { DateTime } from "luxon";

//dd/MM/yyyy HH:mm:ss
export function getIsoDateFromMigrationDate(date: string): string {
    if (!date) {
        throw new Error('El campo "date" es requerido');
    }
    if (!DateTime.fromFormat(date, 'dd/MM/yyyy HH:mm:ss').isValid) {
        throw new Error('El campo "date" tiene un formato inválido');
    }
    return DateTime.fromFormat(date, 'dd/MM/yyyy HH:mm:ss').plus({ hours: 5 }).toISODate();
}   
