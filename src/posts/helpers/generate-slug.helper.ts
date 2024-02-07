import { Post } from "@nestjs/common";
import { AppDataSource } from "src/db/seeders";

export function generateSlug(title: string): string{
    let slug = title.toLowerCase();
    
    slug = slug.replace(/[^\w\s]/g, '');

    slug = slug.replace(/\s+/g, '-');

    return slug;
}

export async function generateUniquePostSlug(title: string): Promise<string>{
    const posts = await AppDataSource.manager.find(Post);
    const slugs = posts.map(post => post.slug);
    let slug = generateSlug(title);
    let uniqueSlug = slug;
    let i = 1;
    while(slugs.includes(uniqueSlug)){
        uniqueSlug = `${slug}-${i}`;
        i++;
    }
    return uniqueSlug;
}