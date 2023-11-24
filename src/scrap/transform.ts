import { readFile } from "fs/promises";
import path from "path";
(async() => {
    const pathEduNews = path.join(__dirname, './db/edu-news.json');
    const pathEduBits = path.join(__dirname, './db/edu-bits.json');
    const pathEduReads = path.join(__dirname, './db/edu-reads.json');
    const pathEduTubes = path.join(__dirname, './db/edu-tube.json');
    const pathEduTrendsPodcast = path.join(__dirname, './db/edutrendspodcast.json');
    Promise.all([
        readFile(pathEduNews),
        readFile(pathEduReads),
        readFile(pathEduBits),
        readFile(pathEduTubes),
        readFile(pathEduTrendsPodcast),
      ])
      .then((resp) => {
        return resp.map(postsJson => {
            const posts = JSON.parse(postsJson.toString());
            return posts.map(p => ({
                ...posts,
                authorImage: 'https://reqres.in/img/faces/7-image.jpg'
            }));
        })
      })
      .then(([
        eduNews,
        eduReads,
        eduBits,
        eduTubes,
        eduTrendsPodcast,
      ]) => {
        console.log({
            eduNews,
            eduReads,
            eduBits,
            eduTubes,
            eduTrendsPodcast,
        })
      })
})()