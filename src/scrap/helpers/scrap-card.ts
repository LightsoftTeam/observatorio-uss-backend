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
        const $image = await $post.$('img.wp-post-image');
        if(!$image || !$link){
            continue;
        }
        const link = await $link.getAttribute('href');
        const title = await $link.textContent();
        const gender = faker.number.int({
            min: 0,
            max: 1,
        }) === 0 ? 'men' : 'women';
        const numberOfPerson = faker.number.int({
            min: 0,
            max: 90,
        });
        const author = faker.person.fullName({
            sex: gender === 'women' ? 'female' : 'male'
        });
        const authorImage = `https://randomuser.me/api/portraits/${gender}/${numberOfPerson}.jpg`
        const image = await $image.getAttribute('src');
        const slug = link.split('tec.mx/').at(-1)
        const $description = await $post.$('.excerpt>p');
        const description = await $description?.textContent() || null;
        posts.push({
            title,
            author,
            authorImage,
            slug,
            link,
            image,
            description,
            category,
        });
    }
    return posts;
}