import { scrapPosts } from "./scrap-posts";
import { scrapTubes } from "./scrap-tubes";

export async function scrapCards({
    page
}){
    const postCategories = [
        'edu-news',
        'edu-bits',
        'edutrendspodcast'
    ]
    for (const category of postCategories) {
        await scrapPosts({page, category});
    }
    const tubeCategories = [
        'edu-tube',
        'edu-reads',
    ]
    for (const category of tubeCategories) {
        await scrapTubes({page, category});
    }
}