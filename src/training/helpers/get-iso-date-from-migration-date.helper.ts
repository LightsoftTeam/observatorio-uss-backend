import { DateTime } from "luxon";

//dd/MM/yyyy HH:mm:ss
export function getIsoDateFromMigrationDate(serial: number): string {
    if (!serial) {
        throw new Error('El campo "date" es requerido');
    }
    const days = Math.floor(serial); // Parte entera del número de serie (días)
    const fractionalDay = serial - days; // Parte decimal (horas, minutos y segundos)

    // La fecha base en luxon (30 de diciembre de 1899)
    const baseDate = DateTime.fromObject({ year: 1899, month: 12, day: 30 });

    // Sumar los días a la fecha base
    let resultDate = baseDate.plus({ days });

    // Sumar la fracción del día
    resultDate = resultDate.plus({ seconds: fractionalDay * 24 * 60 * 60 });

    return resultDate.toISO();
}   
