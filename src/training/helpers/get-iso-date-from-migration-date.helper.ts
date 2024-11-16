import { DateTime } from "luxon";

/**
 * Get ISO date from migration date
 * @param date - date in 'dd/MM/yyyy HH:mm:ss' format
 * @returns ISO date
 */
export function getIsoDateFromMigrationDate(date: string): string {
    // if(!date.includes(':')) {
    //     date = date + ' 00:00:00';
    // }
    console.log('converting date', date);
    const dateObj = DateTime.fromFormat(date, 'dd/MM/yyyy HH:mm:ss');
    if (!dateObj.isValid) {
        throw new Error('Invalid date format');
    }
    const formattedDate = dateObj.plus({ hours: 5 }).toISO();
    return formattedDate;
}   