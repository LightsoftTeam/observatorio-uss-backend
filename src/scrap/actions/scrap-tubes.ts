import { Page } from "playwright";
import { writeFile } from "fs/promises";
import { scrapCard } from "../helpers/scrap-card";

const SUBCATEGORIES_MAP = {
    'edu-tube': [
        {
            name: 'Webinars',
            link: 'https://observatorio.tec.mx/webinars-observatorio',
        },
        {
            name: 'Diálogos',
            link: 'https://observatorio.tec.mx/dialogos-observatorio/',
        },
        {
            name: 'Entrevistas',
            link: 'https://observatorio.tec.mx/entrevistas/',
        },
        {
            name: 'Rie360',
            link: 'https://observatorio.tec.mx/webinars-rie360/',
        },
        {
            name: 'Videotrends',
            link: 'https://observatorio.tec.mx/videotrends/'
        },
    ],
    'edu-reads': [
        {
            name: 'Edutrends',
            link: 'https://observatorio.tec.mx/read-category/edutrends',
        },
        {
            name: 'Edubooks',
            link: 'https://observatorio.tec.mx/edu-books/',
        },

    ]
}

export async function scrapTubes({ page, category }: { page: Page, category: string }) {
    const outputFile = `src/scrap/db/${category}.json`;
    const subcategories = SUBCATEGORIES_MAP[category];
    const posts = []

    for (const subcategory of subcategories) {
        const {name, link: url} = subcategory;
        const articleSelector = `.post-${category.replace('-', '')}`;
        const tubePosts = (await scrapCard({
            page,
            articleSelector,
            category,
            url,
            linkSelector: 'h2>a'
        }))
        .map(item => ({
            ...item,
            subcategory: name
        }))
        posts.push(...tubePosts); 
    }

    await writeFile(outputFile, JSON.stringify(posts, null, 2));
}