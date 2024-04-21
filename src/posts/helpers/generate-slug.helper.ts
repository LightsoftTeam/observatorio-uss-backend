export function generateSlug(title: string): string{
    const slug = title
        .toString()                     // Convertimos el título a cadena
        .normalize('NFD')               // Descomponemos los caracteres acentuados en sus formas normales
        .replace(/[\u0300-\u036f]/g, '') // Eliminamos los signos diacríticos
        .toLowerCase()                  // Convertimos el texto a minúsculas
        .trim()                          // Eliminamos los espacios al inicio y al final
        .replace(/\s+/g, '-')           // Reemplazamos los espacios con guiones
        .replace(/[^\w\-]+/g, '')       // Eliminamos todos los caracteres que no sean palabras, dígitos o guiones
        .replace(/\-\-+/g, '-');        // Reemplazamos múltiples guiones con uno solo

    return slug;
}

export function generateUniquePostSlug({title, slugs}: {title: string, slugs: string[]}): string{
    let slug = generateSlug(title);
    let uniqueSlug = slug;
    let i = 1;
    while(slugs.includes(uniqueSlug)){
        uniqueSlug = `${slug}-${i+1}`;
        i++;
    }
    return uniqueSlug;
}