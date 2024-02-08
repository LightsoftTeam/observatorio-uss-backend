import { Tag } from "src/tags/entities/tag.entity";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

export enum Category{
    NEWS = 'edu-news',
    BITS = 'edu-bits',
    READS = 'edu-reads',
    TUBES = 'edu-tubes',
    // PODCAST = 'edutrendspodcast',
    PODCAST = 'edu-podcast',
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
@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    title: string;
    
    @Column()
    slug: string;
    
    @Column()
    category: string;
    
    @Column({
        nullable: true,
    })
    subCategory: string;
    
    @Column({
        nullable: true,
    })
    readingTime: number;
    
    @Column({
        type: 'text',
        nullable: true,
    })
    description: string;
    
    @Column({
        nullable: true,
    })
    videoUrl: string;

    @Column({
        nullable: true,
    })
    podcastUrl: string;
    
    @Column({
        type: 'text',
    })
    content: string;

    @Column({
        nullable: true,
    })
    imageUrl: string;
    
    @Column({
        nullable: true,
    })
    imageDescription: string;
    
    @Column({
        default: 0,
    })
    likes: number;

    @ManyToOne(() => User)
    user: User;

    @Column()
    userId: number;

    @Column({
        type: 'simple-array',
    })
    attachments: string[];

    @ManyToMany(() => Tag)
    @JoinTable()
    tags: Tag[];

    @Column({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    })
    createdAt: Date;

    @Column({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    })
    updatedAt: Date;
}
