export class FormatDate {
    /**
     * Convert a date string to a human readable format
     * 
     * @param date - The date to convert
     * @returns The date in human readable format
     */
    static toHuman<T>(date: string): string {
        return new Date(date).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}