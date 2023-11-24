import { Page } from "playwright";
import { writeFile } from "fs/promises";
import { scrapCard } from "../helpers/scrap-card";

export async function scrapPosts({page, category}: {page: Page, category: string}){
    const url = `https://${category === 'edutrendspodcast' ? 'observatory' : 'observatorio'}.tec.mx/${category}`;
    const outputFile = `src/scrap/db/${category}.json`;
    const articleSelector = category === 'edutrendspodcast' ? '.post-edutube.podcast' : '.entry-content';
    const posts = await scrapCard({
        page,
        url,
        category,
        articleSelector,
        loadMoreButtonSelector: '.loadmore',
        loadMoreTimes: category === 'edutrendspodcast' ? 2 : 3,
        linkSelector: category === 'edutrendspodcast' ? 'h2>a' : undefined
    })
    await writeFile(outputFile, JSON.stringify(posts, null, 2));
}