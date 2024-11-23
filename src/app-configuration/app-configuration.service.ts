import { Injectable } from '@nestjs/common';
import { CreateAppConfigurationDto } from './dto/create-app-configuration.dto';
import { UpdateAppConfigurationDto } from './dto/update-app-configuration.dto';
import { InjectModel } from '@nestjs/azure-database';
import { AppConfiguration } from './entities/app-configuration.entity';
import { Container } from '@azure/cosmos';

@Injectable()
export class AppConfigurationService {

  constructor(
    @InjectModel(AppConfiguration)
    private readonly acContainer: Container,
  ) {}

  async findAll() {
    const {resources} = await this.acContainer.items.readAll().fetchAll();
    const resp = resources.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {});
    return resp;
  }

  async update(code: string, updateAppConfigurationDto: UpdateAppConfigurationDto) {
    const {value} = updateAppConfigurationDto;
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.key = @key',
      parameters: [
        {name: '@key', value: code},
      ],
    }
    const {resources} = await this.acContainer.items.query<AppConfiguration>(querySpec).fetchAll();
    const [item] = resources;
    if(!item){
      return null;
    }
    item.value = value;
    await this.acContainer.item(item.id, item.tag).replace(item);
    return {
      [item.key]: item.value,
    }
  }
}
