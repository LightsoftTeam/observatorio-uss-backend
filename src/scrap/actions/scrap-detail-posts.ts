import { scrapPosts } from "./scrap-posts";
import { scrapTubes } from "./scrap-tubes";
import * as eduNews from "../db/edu-news.json";
import { writeFile } from "fs/promises";

export async function scrapDetailPosts({
    page
}){
    const post = eduNews[0];
    await page.goto(post.link);
    const $description = await page.$('header .excerpt + p');
    const description = await $description.innerText();
    const $image = await page.$('.post-thumbnail img');
    const image = await $image.getAttribute('src');
    const $content = await page.$('.entry-content');
    const content = await $content.innerHTML();
    const detail = {
        ...post,
        description,
        image,
        content
    }
    writeFile('src/scrap/db/posts/edu-news.json', JSON.stringify(detail));
}