import { scrapPosts } from "./scrap-posts";
import { scrapTubes } from "./scrap-tubes";
import * as eduNews from "../db/edu-news.json";
import { writeFile } from "fs/promises";
import { Locator } from "playwright";

export async function scrapDetailPosts({
    page
}){
    const details = [];
    for (const post of eduNews.slice(0,20)) {
        await page.goto(post.link);
        const $description = await page.$('header .excerpt + p');
        const description = await $description.innerText();
        const $image = await page.$('.post-thumbnail img');
        const image = await $image.getAttribute('src');
        const $imageDescription: Locator = await page.$('span.caption');
        const imageDescription = await $imageDescription.innerHTML();
        const $content = await page.$('.entry-content');
        const content = await $content.innerHTML();
        const detail = {
            ...post,
            description,
            image,
            content,
            imageDescription: imageDescription || null
        }
        details.push(detail);
    }
    writeFile('src/scrap/db/posts/edu-news.json', JSON.stringify(details, null, 2));
}