import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { Guest } from './entities/guest.entity';
import { InjectModel } from '@nestjs/azure-database';
import { Container, SqlQuerySpec } from '@azure/cosmos';
import { ApplicationLoggerService } from 'src/common/services/application-logger.service';
import { FormatCosmosItem } from 'src/common/helpers/format-cosmos-item.helper';
import { DocumentType } from '../common/types/document-type.enum';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { OtpService } from 'src/common/services/otp.service';
import { BASIC_KEYS } from 'src/posts/repositories/post.repository';
import { generateUniqueSlug } from 'src/posts/helpers/generate-slug.helper';

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
    private readonly otpService: OtpService,
  ) {
    this.logger.setContext(GuestsService.name);
  }

  async create(createGuestDto: CreateGuestDto) {
    this.logger.log(`Creating a new guest ${JSON.stringify(createGuestDto)}`);
    const { verificationCode, ...guestPayload } = createGuestDto;
    console.log(await this.cacheManager.get(verificationCode));
    const { documentNumber, documentType, email } = guestPayload;
    await this.otpService.verifyOtp({ code: verificationCode, email });
    const existingGuest = await this.getByDocument({ documentType, documentNumber });
    if(existingGuest) {
      throw new BadRequestException({
        message: "Guest already exists",
        code: "GUEST_ALREADY_EXISTS",
      });
    }
    const slug = generateUniqueSlug({ title: guestPayload.name, slugs: await this.getSlugs() });
    const guest: Guest = {
      ...guestPayload,
      slug,
      isApproved: false,
      createdAt: new Date(),
    };
    const { resource } = await this.guestsContainer.items.create(guest);
    return FormatCosmosItem.cleanDocument(resource);
  }

  async update(id: string, updateGuestDto: UpdateGuestDto) {
    //TODO: update slug if name changes
    this.logger.log(`Updating a guest ${JSON.stringify(updateGuestDto)}`);
    //TODO: remove documentType and documentNumber and email from updateGuestDto
    const guest = await this.findOne(id);
    const { verificationCode, ...guestPayload } = updateGuestDto;
    //TODO: do verification code be obligatory from dto
    await this.otpService.verifyOtp({ code: verificationCode, email: guest.email });
    const updatedGuest = {
      ...guest,
      ...guestPayload,
    };
    const { resource } = await this.guestsContainer.item(id).replace(updatedGuest);
    return FormatCosmosItem.cleanDocument(resource);
  }

  private async getSlugs(): Promise<string[]> {
    const querySpec = {
      query: 'SELECT c.slug FROM c',
      parameters: [],
    };
    const { resources } = await this.guestsContainer.items.query<{ slug: string }>(querySpec).fetchAll();
    return resources.map(u => u.slug);
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

  async findBySlug(slug: string) {
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.slug = @slug',
      parameters: [
        {
          name: '@slug',
          value: slug,
        },
      ],
    };
    const { resources } = await this.guestsContainer.items.query<Guest>(querySpec).fetchAll();
    if (resources.length === 0) {
      throw new NotFoundException('Guest not found');
    }
    return FormatCosmosItem.cleanDocument(resources[0]);
  }

  async findAll() {
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.isApproved = true',
    };
    const { resources } = await this.guestsContainer.items.query<Guest>(querySpec).fetchAll();
    return resources.map(guest => FormatCosmosItem.cleanDocument(guest));
  }

  async findOne(id: string) {
    this.logger.debug(`find guest by id ${id}`);
    try {
      const { resource: guest } = await this.guestsContainer.item(id, id).read<Guest>();
      this.logger.debug(`Guest found: ${JSON.stringify(guest)}`);
      return FormatCosmosItem.cleanDocument(guest);
    } catch (error) {
      this.logger.error(`Guest not found: ${error.message}`);
      throw new NotFoundException('Guest not found');
    }
  }

  async findByDocument({ documentType, documentNumber }: { documentType: DocumentType, documentNumber: string }) {
    this.logger.debug('find guest by document');
    const guest = await this.getByDocument({ documentType, documentNumber });
    if (!guest) {
      throw new NotFoundException('Guest not found');
    }
    return FormatCosmosItem.cleanDocument(guest);
  };

  async getByDocument({ documentType, documentNumber }: { documentType: DocumentType, documentNumber: string }) {
    this.logger.debug('get guest by document');
      const querySpec = {
        query: 'SELECT * FROM c WHERE c.documentType = @documentType AND c.documentNumber = @documentNumber',
        parameters: [
          { name: '@documentType', value: documentType },
          { name: '@documentNumber', value: documentNumber },
        ],
      };
      const { resources } = await this.guestsContainer.items.query<Guest>(querySpec).fetchAll();
      if (resources.length === 0) {
        return null;
      }
      return FormatCosmosItem.cleanDocument(resources[0]);
  }

  async approve(id: string) {
    this.logger.log('Approving a guest');
    const guest = await this.findOne(id);
    guest.isApproved = true;
    await this.guestsContainer.item(id).replace(guest);
    return FormatCosmosItem.cleanDocument(guest);
  }

  remove(id: number) {
    return `This action removes a #${id} guest`;
  }
}
