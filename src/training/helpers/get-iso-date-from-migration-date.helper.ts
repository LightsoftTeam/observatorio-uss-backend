import { DateTime } from "luxon";

/**
 * Get ISO date from migration date
 * @param date - date in 'dd/MM/yyyy HH:mm:ss' format
 * @returns ISO date
 */
export function getIsoDateFromMigrationDate(date: string): string {
    const formattedDate = DateTime.fromFormat(date, 'dd/MM/yyyy HH:mm:ss').plus({ hours: 5 }).toISO();
    return formattedDate;
}   
