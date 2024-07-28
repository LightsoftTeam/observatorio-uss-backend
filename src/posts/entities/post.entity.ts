import { CosmosDateTime, CosmosPartitionKey } from "@nestjs/azure-database";

export enum Category{
    NEWS = 'edu-news',
    BITS = 'edu-bits',
    READS = 'edu-reads',
    TUBES = 'edu-tubes',
    PODCAST = 'edu-podcast',
    EDITORIAL = 'editorial',
}

export enum SubCategory{
    EDUTRENDS = 'edutrends',
    EDUBOOKS = 'edubooks',
    WEBINARS = 'webinars',
    DIÁLOGOS = 'dialogues',
    ENTREVISTAS = 'interviews',
    RIE360 = 'rie360',
    VIDEOTRENDS = 'videotrends',
}

export interface Reference{
    author: string;
    url: string;
}
@CosmosPartitionKey('category')
export class Post {
    id?: string;
    title: string;
    slug: string;
    category: string;
    subCategory?: string;
    readingTime?: number;
    description?: string;
    videoUrl?: string;
    podcastUrl?: string;
    content?: string;
    imageUrl?: string;
    imageDescription?: string;
    likes: number;
    userId?: string;
    attachments: string[];
    tags: string[];
    isActive: boolean;
    reference?: Reference;
    isPendingApproval?: boolean;
    @CosmosDateTime() createdAt: Date;
}
