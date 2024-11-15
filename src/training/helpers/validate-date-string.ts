export function validateDateString(dateString: string) {
    // Expresión regular para el formato YYYY-MM-DD
    const regex = /^\d{4}-\d{2}-\d{2}$/;

    if (!regex.test(dateString)) {
        throw new Error('La fecha debe estar en el formato YYYY-MM-DD');
    }

    return true;
}