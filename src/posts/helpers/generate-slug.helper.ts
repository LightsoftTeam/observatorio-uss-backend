export function generateSlug(title: string): string{
    let slug = title.toLowerCase();
    
    slug = slug.replace(/[^\w\s]/g, '');

    slug = slug.replace(/\s+/g, '-');

    return slug;
}

export async function generateUniquePostSlug({title, slugs}: {title: string, slugs: string[]}): Promise<string>{
    let slug = generateSlug(title);
    let uniqueSlug = slug;
    let i = 1;
    while(slugs.includes(uniqueSlug)){
        uniqueSlug = `${slug}-${i}`;
        i++;
    }
    return uniqueSlug;
}