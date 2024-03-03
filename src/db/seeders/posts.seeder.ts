import { Category, Post } from 'src/posts/entities/post.entity';
import { calculateReadTime } from 'src/posts/helpers/calculate-read-time.helper';
import { generateSlug } from 'src/posts/helpers/generate-slug.helper';
import { readFile } from 'fs/promises';

export async function postsSeeder({
    authorIds,
}: {
    authorIds: string[]
}){
    const postsJson = await readFile('src/scrap/db/posts/posts.json', 'utf-8');
    const posts = JSON.parse(postsJson);
    const counter = {};
    const postMocks = (posts as any[]).map(post => {
        const categoryScrap = post.category;
        if(!counter[categoryScrap]){
            counter[categoryScrap] = 0;
        }else{
            counter[categoryScrap]++;
        }
        if(counter[categoryScrap] > 35){
            return null;
        }
        const userId = authorIds[Math.floor(Math.random() * authorIds.length)];
        const { title, description, content, image: imageUrl, imageDescription, video: videoUrl, podcast: podcastUrl } = post;
        const slug = generateSlug(post.title);
        const likes = Math.floor(Math.random() * 100);
        const readingTime = calculateReadTime(post.content);
        const attachments = post.resource ? [
            post.resource
        ] : [];
        const tags = post.tags.map(tag => (tag as string).trim().toLowerCase());

        const category = post.category === 'edu-tube' 
        ? Category.TUBES 
        : (
            post.category === 'edutrendspodcast' 
            ? Category.PODCAST
            : post.category
        );
        const subCategoryScrap = post.subcategory?.toLowerCase();
        const subCategory = subCategoryScrap === 'Diálogos'
            ? 'dialogues'
            : (
                subCategoryScrap === 'Entrevistas'
                ? 'interviews'
                : (subCategoryScrap ?? undefined)
            )
        const postMock: Post = {
            title,
            description: description ?? undefined,
            content: content ?? undefined,
            imageUrl: imageUrl ?? undefined,
            imageDescription: imageDescription ?? undefined,
            videoUrl: videoUrl ?? undefined,
            podcastUrl: podcastUrl ?? undefined,
            slug,
            likes,
            readingTime: readingTime ?? undefined,
            attachments,
            tags,
            category,
            subCategory: subCategory ?? undefined,
            userId,
            isActive: true,
            createdAt: new Date(),
        };
        return postMock;
    });
    const withoutNulls = postMocks.filter(post => post);
    console.log(withoutNulls.length, 'posts')
    return withoutNulls;
}