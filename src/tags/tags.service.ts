import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Tag } from './entities/tag.entity';
import { Like, Repository } from 'typeorm';
import { CreateTagDto } from './dto/create-tag.dto';

@Injectable()
export class TagsService {
    constructor(
        @InjectRepository(Tag)
        private tagsRepository: Repository<Tag>,
    ) { }

    findAll(search: string = '') {
        return this.tagsRepository.find({
            where: [
                { name: Like(`%${search}%`) },
            ],
        });
    }

    findOne(id: number) {
        return this.tagsRepository.findOne({
            where: { id },
        });
    }

    async create(createTagDto: CreateTagDto) {
        const { name } = createTagDto;
        const existingTag = await this.tagsRepository.findOne({
            where: { name },
        });
        if (existingTag) {
            throw new BadRequestException('Tag already exists');
        }
        const tag = new Tag();
        tag.name = createTagDto.name;
        return this.tagsRepository.save(tag);
    }
}
