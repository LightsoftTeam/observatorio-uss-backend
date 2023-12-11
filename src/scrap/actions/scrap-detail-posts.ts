import { scrapPosts } from "./scrap-posts";
import { scrapTubes } from "./scrap-tubes";
import * as eduNews from "../db/edu-news.json";
import * as eduBits from "../db/edu-bits.json";
import * as eduTubes from "../db/edu-tube.json";
import * as eduReads from "../db/edu-reads.json";
import * as podcast from "../db/edutrendspodcast.json";
import * as oldPosts from "../db/posts/posts.json";
import { writeFile } from "fs/promises";
import { Locator } from "playwright";
import { faker } from "@faker-js/faker";

const posts = [
    // ...eduNews,
    // ...eduBits,
    ...eduReads,
    ...eduTubes,
    ...podcast
]

export async function scrapDetailPosts({
    page
}){
    const details = [];
    for (const post of posts) {
        console.log(post.link)
        await page.goto(post.link);
        const $description = await page.$('header .excerpt + p');
        const description = await $description?.innerText();
        const $date = await page.$('.meta-box > .byline > span');
        const date = await $date?.innerText();
        const $readingTime = await page.$('.span-reading-time.rt-reading-time');
        const readingTime = await $readingTime?.innerText();
        const $image = await page.$('.post-thumbnail img');
        const image = await $image?.getAttribute('src');
        const $video = await page.$('iframe');
        const video = await $video?.getAttribute('src');
        const $podcast = await page.$('iframe');
        const podcast = await $podcast?.getAttribute('src');
        const $imageDescription: Locator = await page.$('span.caption');
        const imageDescription = await $imageDescription.innerHTML();
        const $content = await page.$('.entry-content');
        const content = await $content.innerHTML();
        const $tags = await page.$$('.tags a');
        const tags = await Promise.all($tags.map(async $tag => {
            const tag = await $tag.innerText();
            return tag;
        }));
        const $resource = await page.$('a.wp-block-button__link.wp-element-button');
        const resource = await $resource?.getAttribute('href');
        const detail = {
            ...post,
            date,
            readingTime,
            description,
            image,
            video: video?.includes('youtube') ? video : undefined,
            podcast: podcast?.includes('spotify') ? podcast : undefined,
            content,
            imageDescription: imageDescription || null,
            likes: faker.number.int({
                min: 0,
                max: 15
            }),
            resource,
            tags                 
        }
        details.push(detail);
    }
    writeFile('src/scrap/db/posts/posts.json', JSON.stringify([...(oldPosts as any), ...details], null, 2));
}