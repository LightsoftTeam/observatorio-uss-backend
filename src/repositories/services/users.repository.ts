import { InjectModel } from '@nestjs/azure-database';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Role, User } from 'src/users/entities/user.entity';
import { Container } from '@azure/cosmos';
import { ApplicationLoggerService } from 'src/common/services/application-logger.service';
import { DocumentType } from 'src/common/types/document-type.enum';
import { AttendanceStatus } from 'src/training/entities/training.entity';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { generateUniqueSlug } from 'src/posts/helpers/generate-slug.helper';
import { COUNTRIES_MAP } from 'src/common/constants/countries';
import { APP_ERRORS, ERROR_CODES } from 'src/common/constants/errors.constants';

const PASSWORD_SALT_ROUNDS = 5;

interface Filters {
    role?: Role;
}

@Injectable()
export class UsersRepository {
    constructor(
        @InjectModel(User)
        private readonly usersContainer: Container,
        private readonly logger: ApplicationLoggerService,
    ) { }

    async findAll(filters: Filters = {}): Promise<User[]> {
        const { role } = filters;
        this.logger.log('Getting all users');
        const querySpec = {
            query: 'SELECT * FROM c',
            parameters: [],
        };
        if (role) {
            querySpec.query += ' WHERE c.role = @role';
            querySpec.parameters = [{ name: '@role', value: role }];
        }
        const { resources } = await this.usersContainer.items.query<User>(querySpec).fetchAll();
        return resources;
    }

    async getByDocument({ documentType, documentNumber }: { documentType: DocumentType, documentNumber: string }): Promise<User | null> {
        this.logger.log(`Getting user with document ${documentType} ${documentNumber}`);
        const querySpec = {
            query: 'SELECT * FROM c WHERE c.documentType = @documentType AND c.documentNumber = @documentNumber',
            parameters: [
                { name: '@documentType', value: documentType },
                { name: '@documentNumber', value: documentNumber },
            ],
        };
        const { resources } = await this.usersContainer.items.query<User>(querySpec).fetchAll();
        if (resources.length === 0) {
            this.logger.log(`User with document ${documentType} ${documentNumber} not found`);
            return null;
        }
        return resources[0];
    }

    async getById(id: string) {
        try {
            this.logger.log(`Getting user with id ${id}`);
            const { resource } = await this.usersContainer.item(id, id).read<User>();
            return resource;
        } catch (error) {
            return null;
        }
    }

    async create(createUserDto: CreateUserDto) {
        this.logger.debug(`Creating user ${JSON.stringify(createUserDto)}`);
        const hashedPassword = bcrypt.hashSync(createUserDto.password, PASSWORD_SALT_ROUNDS);
        const slug = generateUniqueSlug({ title: createUserDto.name, slugs: await this.getSlugs() });
        const { countryCode } = createUserDto;
        const country = COUNTRIES_MAP[countryCode];
        if (countryCode && !country) {
            throw new BadRequestException('Invalid country code');
        }
        const user = {
            ...createUserDto,
            slug,
            password: hashedPassword,
            role: createUserDto.role || Role.AUTHOR,
            isActive: true,
            createdAt: new Date(),
        };
        const { documentType, documentNumber, employmentType, schoolId } = user;
        if ((user.role === Role.PROFESSOR || user.requestedRole === Role.PROFESSOR) && (!documentType || !documentNumber || !employmentType || !schoolId)) {
            throw new BadRequestException('Missing required fields for professor');
        }
        const existingUser = await this.getDuplicatedUser({ email: user.email, documentType, documentNumber });
        if (existingUser) {
            this.logger.debug(`User with email ${user.email} already exists`);
            throw new BadRequestException(APP_ERRORS[ERROR_CODES.USER_ALREADY_EXISTS]);
        }
        const { resource } = await this.usersContainer.items.create<User>(user);
        return resource;
    }

    async getDuplicatedUser({email, documentType, documentNumber}: {email: string, documentType: DocumentType, documentNumber: string}) {
        this.logger.debug(`Checking for duplicated user with email ${email} and document ${documentType} ${documentNumber}`);
        const querySpec = {
            query: 'SELECT * FROM c WHERE c.email = @email OR (c.documentType = @documentType AND c.documentNumber = @documentNumber)',
            parameters: [
                { name: '@email', value: email },
                { name: '@documentType', value: documentType },
                { name: '@documentNumber', value: documentNumber },
            ],
        };
        const { resources } = await this.usersContainer.items.query<User>(querySpec).fetchAll();
        const duplicated = resources.at(0);
        if(duplicated){
            this.logger.debug(`Duplicated user found: ${JSON.stringify(duplicated)}`);
        }
        return duplicated;
    }

    private async getSlugs(): Promise<string[]> {
        const querySpec = {
            query: 'SELECT c.slug FROM c',
            parameters: [],
        };
        const { resources } = await this.usersContainer.items.query<{ slug: string }>(querySpec).fetchAll();
        return resources.map(u => u.slug);
    }

    async findByEmail(email: string): Promise<User | null> {
        const querySpec = {
            query: 'SELECT * FROM c WHERE c.email = @email',
            parameters: [
                {
                    name: '@email',
                    value: email,
                },
            ],
        };
        const { resources } = await this.usersContainer.items.query<User>(querySpec).fetchAll();
        if (resources.length === 0) {
            return null;
        }
        return resources[0];
    }

    async findByIds(ids: string[]) {
        const querySpec = {
            query: 'SELECT * FROM c WHERE ARRAY_CONTAINS(@ids, c.id)',
            parameters: [
                {
                    name: '@ids',
                    value: ids,
                },
            ],
        };
        const { resources } = await this.usersContainer.items.query<User>(querySpec).fetchAll();
        return resources;
    }
}
