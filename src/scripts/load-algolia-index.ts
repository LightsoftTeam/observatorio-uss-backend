import algoliasearch from 'algoliasearch';
import { postsContainer } from './db';

// Load environment variables from .env file
require('dotenv').config();

// Connect and authenticate with your Algolia app
const client = algoliasearch(process.env.ALGOLIA_ID, process.env.ALGOLIA_ADMIN_KEY);

// Create a new index. An index stores the data that you want to make searchable in Algolia.
const index = client.initIndex(process.env.ALGOLIA_ID);

async function loadIndex(){
    const querySpec = {
        query: "SELECT c.id, c.title, c.slug, c.description, c.imageUrl, c.tags from c"
    }
    const {resources} = await postsContainer.items.query(querySpec).fetchAll();
    const records = resources.map((post) => {
        const objectID = post.id;
        delete post.id;
        return {
            objectID,
            ...post,
        }
    });
    index.saveObjects(records, {
      // set autoGenerateObjectIDIfNotExist to false if your records contain an ObjectID
      autoGenerateObjectIDIfNotExist: false
    })
    .then(_ => console.log('Records imported to Algolia'))
    .catch((err) => {
      console.log(err);
    });
}
loadIndex();