import { CosmosClient } from '@azure/cosmos';
require('dotenv').config();

const endpoint = process.env.DB_ENDPOINT;
const key = process.env.DB_KEY;
const dbName = process.env.DB_NAME;
const cosmosClient = new CosmosClient({ endpoint, key });
export const postsContainer = cosmosClient.database(dbName).container('posts');