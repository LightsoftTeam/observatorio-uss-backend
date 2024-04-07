import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/azure-database';
import type { Container } from '@azure/cosmos';
import { CreateAuthorityDto } from './dto/create-authority.dto';
import { UpdateAuthorityDto } from './dto/update-authority.dto';
import { Authority } from './entities/authority.entity';
import { FormatCosmosItem } from '../common/helpers/format-cosmos-item.helper';

@Injectable()
export class AuthoritiesService {
  constructor(
    // Inject the `Authority` entity
    @InjectModel(Authority)
    private authorityContainer: Container,
  ) {}

  async create(createAuthorityDto: CreateAuthorityDto) {
    const authority = {
      ...createAuthorityDto,
      hierarchy: createAuthorityDto.hierarchy ?? 0,
      createdAt: new Date(),
    }
    const { resource } = await this.authorityContainer.items.create<Authority>(authority);
    return FormatCosmosItem.cleanDocument(resource);
  }

  async findAll() {
    const querySpec = {
      query: 'SELECT * FROM c order by c.hierarchy DESC',
    }
    const { resources } = await this.authorityContainer.items.query(querySpec).fetchAll();
    return resources.map(authority => FormatCosmosItem.cleanDocument(authority));
  }

  async update(id: string, updateAuthorityDto: UpdateAuthorityDto) {
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.id = @id',
      parameters: [
        {
          name: '@id',
          value: id,
        },
      ],
    };
    const { resources } = await this.authorityContainer.items.query(querySpec).fetchAll();
    if(resources.length === 0){
      throw new NotFoundException('Authority not found');
    }
    const authority = resources[0];
    const updatedAuthority = {...authority, ...updateAuthorityDto};
    const { resource } = await this.authorityContainer.item(updatedAuthority.id).replace(updatedAuthority);
    return FormatCosmosItem.cleanDocument(resource);
  }

  remove(id: string) {
    return this.authorityContainer.item(id, id).delete();
  }
}
