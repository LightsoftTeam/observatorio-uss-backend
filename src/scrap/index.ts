
import {chromium} from 'playwright';
import { scrapPosts } from "./actions/scrap-posts";
import { scrapTubes } from './actions/scrap-tubes';
const HEADLESS_MODE = false;

(async() => {
    const browser = await chromium.launch({headless: HEADLESS_MODE});
    const page = await browser.newPage();
    const postCategories = [
        // 'edu-news',
        // 'edu-bits',
        'edutrendspodcast'
    ]
    for (const category of postCategories) {
        await scrapPosts({page, category});
    }
    // const tubeCategories = [
    //     'edu-tube',
    //     'edu-reads',
    // ]
    // for (const category of tubeCategories) {
    //     await scrapTubes({page, category});
    // }
    await browser.close();
})();

