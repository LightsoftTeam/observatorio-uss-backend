// import * as posts from '../../scrap/db/posts/posts.json';
import { readFile } from 'fs/promises';
import { AppDataSource } from '.';
import { Tag } from 'src/tags/entities/tag.entity';

export async function tagsSeeder(){
    const postsJson = await readFile('src/scrap/db/posts/posts.json', 'utf-8');
    const posts = JSON.parse(postsJson);
    const tags = (posts as any[]).flatMap(post => post.tags);
    const uniqueTags = Array.from(new Set(tags));
    const newTags = uniqueTags.map(tag => {
        const newTag = new Tag();
        newTag.name = tag.toLowerCase();
        return newTag;
    });
    return await AppDataSource.manager.save(Tag, newTags);
}