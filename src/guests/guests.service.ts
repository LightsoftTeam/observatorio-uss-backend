import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { Guest } from './entities/guest.entity';
import { InjectModel } from '@nestjs/azure-database';
import { Container } from '@azure/cosmos';
import { ApplicationLoggerService } from 'src/common/services/application-logger.service';
import { FormatCosmosItem } from 'src/common/helpers/format-cosmos-item.helper';
import { DocumentType } from '../common/types/document-type.enum';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

export enum CREATE_ERRORS {
  INVALID_CODE_ERROR = 'INVALID_CODE_ERROR',
}

@Injectable()
export class GuestsService {

  constructor(
    @InjectModel(Guest)
    private readonly guestsContainer: Container,
    private readonly logger: ApplicationLoggerService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.logger.setContext(GuestsService.name);
  }

  async create(createGuestDto: CreateGuestDto) {
    this.logger.log('Creating a new guest');
    const { verificationCode, ...guestPayload } = createGuestDto;
    const guest: Guest = {
      ...guestPayload,
      isApproved: false,
      createdAt: new Date(),
    };
    const verifiedEmail = await this.cacheManager.get(verificationCode);
    if (verifiedEmail !== guest.email) {
      throw new BadRequestException({
        message: "Invalid code",
        code: CREATE_ERRORS.INVALID_CODE_ERROR,
      });
    }
    const { resource } = await this.guestsContainer.items.create(guest);
    return FormatCosmosItem.cleanDocument(resource);
  }

  async getByIds(ids: string[]) {
    this.logger.log('Getting guests by ids');
    const query = {
      query: 'SELECT * FROM c WHERE ARRAY_CONTAINS(@ids, c.id)',
      parameters: [{ name: '@ids', value: ids }],
    };
    const { resources } = await this.guestsContainer.items.query<Guest>(query).fetchAll();
    return resources.map(guest => FormatCosmosItem.cleanDocument(guest));
  }

  findAll() {
    return `This action returns all guests`;
  }

  async findOne(id: string) {
    this.logger.debug(`find guest by id ${id}`);
    try {
      const { resource: guest } = await this.guestsContainer.item(id, id).read<Guest>();
      this.logger.debug(`Guest found: ${JSON.stringify(guest)}`);
      return FormatCosmosItem.cleanDocument(guest);
    } catch (error) {
      this.logger.error(`Guest not found: ${error.message}`);
      throw new Error('Guest not found');
    }
  }

  async findByDocument({ documentType, documentNumber }: { documentType: DocumentType, documentNumber: string }) {
    this.logger.debug('find guest by document');
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.documentType = @documentType AND c.documentNumber = @documentNumber',
      parameters: [
        { name: '@documentType', value: documentType },
        { name: '@documentNumber', value: documentNumber },
      ],
    };
    const { resources } = await this.guestsContainer.items.query<Guest>(querySpec).fetchAll();
    if (resources.length === 0) {
      throw new Error('Guest not found');
    }
    return FormatCosmosItem.cleanDocument(resources[0]);
  };

  async approve(id: string) {
    this.logger.log('Approving a guest');
    const guest = await this.findOne(id);
    guest.isApproved = true;
    await this.guestsContainer.item(id).replace(guest);
    return FormatCosmosItem.cleanDocument(guest);
  }

  update(id: number, updateGuestDto: UpdateGuestDto) {
    return `This action updates a #${id} guest`;
  }

  remove(id: number) {
    return `This action removes a #${id} guest`;
  }
}
