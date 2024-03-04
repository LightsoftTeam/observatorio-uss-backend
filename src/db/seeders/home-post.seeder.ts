import { indexLimits } from "src/posts/entities/home-post.entity";

export function homePostsSeeder(){
    const postId = 'a98945eb-32c2-40dd-b2f2-7c0e6e521580';
    const homePostsMocks = Object.entries(indexLimits).flatMap(([section, limit]) => {
        const sectionPosts = [];
        for (let i = 1; i <= limit; i++) {
            const homePost = { 
                postId,
                section,
                index: i
            }
            sectionPosts.push(homePost);
        }
        return sectionPosts;
    });
    return homePostsMocks;
}