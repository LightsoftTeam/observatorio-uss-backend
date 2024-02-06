import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    title: string;
    
    @Column()
    author: string;
    
    @Column()
    authorImage: string;
    
    @Column()
    slug: string;
    
    @Column()
    category: string;
    
    @Column()
    subCategory: string;
    
    @Column()
    date: string;
    
    @Column()
    readingTime: string;
    
    @Column()
    description: string;
    
    @Column()
    videoUrl: string;
    
    @Column({
        type: 'text',
    })
    content: string;
    
    @Column()
    imageDescription: string;
    
    @Column()
    likes: number;
}
