import { Locator } from "playwright";
import { waitNewElements } from "./wait-new-elements";
import { faker } from "@faker-js/faker";

export async function scrapCard({
    page,
    url,
    category,
    articleSelector,
    loadMoreButtonSelector = null,
    loadMoreTimes = 1,
    linkSelector = 'a'
}){
    await page.goto(url);
    await page.waitForSelector(articleSelector);
    let $posts = await page.$$(articleSelector);
    if(loadMoreButtonSelector){
        const $loadMoreButton = await page.$(loadMoreButtonSelector);
        for (let index = 0; index < loadMoreTimes; index++) {
            await $loadMoreButton.click();
            await waitNewElements({page, initialCount: $posts.length, selector: articleSelector});
            $posts = await page.$$(articleSelector)
        }
    }
    const posts = []
    for (const $post of $posts) {
        const $link: Locator = await $post.$(linkSelector);
        const link = await $link.getAttribute('href');
        const title = await $link.textContent();
        const $image = await $post.$('img.wp-post-image');
        const $author = await $post.$('.author>span')
        const author = await $author?.textContent() || faker.person.fullName();
        if(!$image){
            continue;
        }
        const image = await $image.getAttribute('src');
        const slug = link.split('tec.mx/').at(-1)
        posts.push({
            title,
            author,
            slug,
            link,
            image,
            category,
        });
    }
    return posts;
}