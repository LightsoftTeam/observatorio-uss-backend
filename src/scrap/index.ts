
import {chromium} from 'playwright';
import { scrapPosts } from "./actions/scrap-posts";
import { scrapTubes } from './actions/scrap-tubes';
// import { scrapDetailPosts } from './actions/scrap-detail-posts';
const HEADLESS_MODE = true;

const categories = ['edu-news', 'edu-bits', 'edu-tube', 'edu-reads', 'edutrendspodcast'];

(async() => {
    const browser = await chromium.launch({headless: HEADLESS_MODE});
    const page = await browser.newPage();
    // await scrapDetailPosts({page});
    await scrapPosts({page, category: categories[0]});
    await browser.close();
})();

