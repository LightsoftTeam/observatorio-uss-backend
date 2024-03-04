import { CosmosPartitionKey } from "@nestjs/azure-database";

export enum Section{
    EDITORIAL = 'editorial',
    SECTION_ONE = 'section-1',
    SECTION_TWO = 'section-2',
    SECTION_THREE = 'section-3',
    SECTION_FOUR = 'section-4',
}

export const indexLimits = {
    [Section.EDITORIAL]: 1,
    [Section.SECTION_ONE]: 4,
    [Section.SECTION_TWO]: 7,
    [Section.SECTION_THREE]: 6,
    [Section.SECTION_FOUR]: 2,
}

@CosmosPartitionKey('section')
export class HomePost {
    id?: string;
    postId: string;
    section: Section;
    index: number;
}
