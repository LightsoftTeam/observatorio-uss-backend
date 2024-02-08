import { faker } from '@faker-js/faker';
import { User } from '../../users/entities/user.entity';
// import * as posts from '../../scrap/db/posts/posts.json';
import { Category, Post } from 'src/posts/entities/post.entity';
import { calculateReadTime } from 'src/posts/helpers/calculate-read-time.helper';
import { generateSlug } from 'src/posts/helpers/generate-slug.helper';
import { AppDataSource } from '.';
import { Tag } from 'src/tags/entities/tag.entity';

export function postsSeeder({
    users,
    tags
}: {
    users: User[],
    tags: Tag[]
}){
    const newPosts = ([] as any[]).map(post => {
        const user = users[Math.floor(Math.random() * users.length)];
        const newPost = new Post();
        newPost.title = post.title;
        newPost.description = post.description;
        newPost.content = post.content;
        newPost.date = faker.date.recent().toISOString() ?? null;
        newPost.user = user;
        newPost.imageUrl = post.image ?? null;
        newPost.imageDescription = post.imageDescription ?? null;
        newPost.videoUrl = post.video ?? null;
        newPost.podcastUrl = post.podcast ?? null;
        newPost.slug = generateSlug(post.title);
        newPost.likes = Math.floor(Math.random() * 100);
        newPost.readingTime = calculateReadTime(post.content);
        newPost.attachments = post.resource ? [
            post.resource
        ] : [];
        const tagsDB = post.tags.map(tag => {
            return tags.find(t => t.name === (tag as string).toLowerCase());
        });
        newPost.tags = tagsDB;

        newPost.category = post.category === 'edu-tube'
        
        ? Category.TUBES 
        : (
            post.category === 'edutrendspodcast' 
            ? Category.PODCAST
            : post.category
        );
        const subCategory = post.subcategory?.toLowerCase();
        newPost.subCategory = subCategory === 'Diálogos'
            ? 'dialogues'
            : (
                subCategory === 'Entrevistas'
                ? 'interviews'
                : (subCategory ?? null)
            )
        return newPost;
    });
    console.log(JSON.stringify(newPosts, null, 2));
    AppDataSource.manager.save(Post, newPosts);
}