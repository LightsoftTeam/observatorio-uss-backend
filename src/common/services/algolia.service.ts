import { Injectable } from '@nestjs/common';
import algoliasearch from 'algoliasearch';
import { loadIndex } from 'src/scripts/load-algolia-index';

export interface PostAlgoliaRecord {
    objectID: string;
    title: string;
    slug: string;
    description: string;
    imageUrl: string;
    tags: string[];
}

@Injectable()
export class AlgoliaService {
    client = algoliasearch(process.env.ALGOLIA_ID, process.env.ALGOLIA_ADMIN_KEY);
    index = this.client.initIndex(process.env.ALGOLIA_ID);

    saveObject(record: any){
        return this.index.saveObject(record);
    }

    saveObjects(records: any[]){
        return this.index.saveObjects(records);
    }

    deleteObject(objectID: string){
        return this.index.deleteObject(objectID);
    }

    deleteObjects(objectIDs: string[]){
        return this.index.deleteObjects(objectIDs);
    }

    updateObject(record: any){
        return this.index.partialUpdateObject(record);
    }

    async syncAlgolia(){
        await loadIndex();
        return 'Algolia index synced';
    }
}
