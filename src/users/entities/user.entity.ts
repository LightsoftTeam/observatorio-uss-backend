import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export enum Role{
    ADMIN = 'admin',
    AUTHOR = 'author',
}
@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({
        nullable: true,
    })
    image: string;

    @Column({
        unique: true,
    })
    email: string;

    @Column()
    password: string;

    @Column({
        type: 'enum',
        enum: Role,
        default: Role.AUTHOR,
    })
    role: Role;

    @Column({ default: true })
    isActive: boolean;

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

    toJson(){
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            role: this.role,
            image: this.image,
            isActive: this.isActive,
        }
    }
}