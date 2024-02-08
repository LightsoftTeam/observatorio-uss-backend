import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Tag } from './entities/tag.entity';
import { Like, Repository } from 'typeorm';

@Injectable()
export class TagsService {
    constructor(
        @InjectRepository(Tag)
        private tagsRepository: Repository<Tag>,
    ) {}

    findAll(search: string = '') {
        return this.tagsRepository.find({
            where: [
                { name: Like(`%${search}%`) },
            ],
        });
    }
}
