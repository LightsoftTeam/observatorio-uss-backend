import { writeFile } from "fs";
import { readFile } from "fs/promises";
import { Post } from "src/posts/entities/post.entity";

async function main(){
    const posts = await readFile('src/scrap/db/posts/posts.json', {
        encoding: 'utf-8'
    });
    console.log(JSON.parse(posts).length)
    const count = {
        'edu-news': 0,
        'edu-bits': 0,
        'edu-tube': 0,
        'edu-reads': 0,
        'edutrendspodcast': 0,
    }
    let postsBody = JSON.parse(posts).map(p => {
        if(count[p.category] >= 30){
            return null;
        }
        count[p.category]++;
        let {
            title, 
            link,
            image, 
            description, 
            category, 
            content, 
            imageDescription, 
            tags,
            podcast,
            video,
        } = p;
        if(category === 'edu-tube'){
            category = 'edu-tubes';
        }
        if(category === 'edutrendspodcast'){
            category = 'edu-podcast';
        }
        const postBody: Partial<Post> = {
            title,
            description: description || undefined,
            category,
            videoUrl: video || undefined,
            podcastUrl: podcast || undefined, 
            content,
            imageUrl: image || undefined,
            imageDescription: imageDescription || undefined,
            attachments: [],
            tags: tags.map((t: string) => t.toLowerCase()),
            reference: {
                author: 'Observatorio Tec Monterrey',
                url:  link,
            }
        }
        return postBody;
    });
    postsBody = postsBody.filter(p => p !== null);  
    console.log(count)
    writeFile('src/scrap/outputs/posts.ts', JSON.stringify(postsBody, null, 2), (err) => {
        if(err){
            console.error(err);
        }
    }
    );
}

main();