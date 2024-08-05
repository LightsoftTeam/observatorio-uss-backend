import { BadRequestException, Inject, Injectable, NotFoundException, Scope, forwardRef } from '@nestjs/common';
import type { Container } from '@azure/cosmos';
import { Role, User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/azure-database';
import { FormatCosmosItem } from 'src/common/helpers/format-cosmos-item.helper';
import { UpdateUserDto } from './dto/update-user.dto';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { ApplicationLoggerService } from 'src/common/services/application-logger.service';
import { REQUEST } from '@nestjs/core';
import { generateUniqueSlug } from 'src/posts/helpers/generate-slug.helper';
import { FindUsersDto } from './dto/find-users.dto';
import { APP_ERRORS, ERROR_CODES } from 'src/common/constants/errors.constants';

const PASSWORD_SALT_ROUNDS = 5;
const USER_LIST_CACHE_KEY = 'users';
const LONG_CACHE_TIME = 1000 * 60 * 60 * 5;//5 hours


@Injectable({ scope: Scope.REQUEST })
export class UsersService {

  constructor(
    @InjectModel(User)
    private readonly usersContainer: Container,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly logger: ApplicationLoggerService,
    @Inject(REQUEST) private request: Request,
  ) { }

  async findAll(findUsersDto: FindUsersDto = {}) {
    this.logger.log(`retrieving users - ${JSON.stringify(findUsersDto)}`);
    const { roles: rolesString } = findUsersDto;
    let roles = rolesString ? rolesString.split(',') : [];
    if (roles.length === 0) {
      this.logger.log('pushing roles');
      roles.push(...Object.values(Role));
    }
    if (!this.isAdmin()) {
      roles = roles.filter(r => r !== Role.ADMIN);
    }
    this.logger.log(`selected roles - ${JSON.stringify(roles)}`);
    const querySpec = {
      query: 'SELECT * FROM c where c.isActive = true AND ARRAY_CONTAINS(@roles, c.role) order by c.createdAt DESC',
      parameters: [
        {
          name: '@roles',
          value: roles,
        },
      ],
    };
    const startAt = new Date();
    const { resources } = await this.usersContainer.items.query<User>(querySpec).fetchAll();
    this.logger.log(`query time findAll users ${(new Date().getTime() - startAt.getTime())}`);
    return resources.map(user => FormatCosmosItem.cleanDocument(user, ['password']));
  }

  async toggleActiveState(id: string) {
    const user = await this.findOne(id);
    return this.updateStatus({ id, isActive: !user.isActive });
  }

  async findOne(id: string) {
    try {
      const { resource } = await this.usersContainer.item(id, id).read<User>();
      return resource;
    } catch (error) {
      throw new NotFoundException('User not found');
    }
  }

  async findBySlug(slug: string) {
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.slug = @slug AND c.isActive = true',
      parameters: [
        {
          name: '@slug',
          value: slug,
        },
      ],
    };
    const { resources } = await this.usersContainer.items.query<User>(querySpec).fetchAll();
    if (resources.length === 0) {
      throw new NotFoundException('User not found');
    }
    return FormatCosmosItem.cleanDocument(resources[0], ['password']);
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

  async create(createUserDto: CreateUserDto) {
    const hashedPassword = bcrypt.hashSync(createUserDto.password, PASSWORD_SALT_ROUNDS);
    const slug = generateUniqueSlug({ title: createUserDto.name, slugs: await this.getSlugs() });
    const user = {
      ...createUserDto,
      slug,
      password: hashedPassword,
      role: createUserDto.role || Role.AUTHOR,
      isActive: true,
      createdAt: new Date(),
    };
    const existingUser = await this.findByEmail(user.email);
    if (existingUser) {
      throw new BadRequestException(APP_ERRORS[ERROR_CODES.USER_ALREADY_EXISTS]);
    }
    const { resource } = await this.usersContainer.items.create<User>(user);
    const newUser = FormatCosmosItem.cleanDocument(resource, ['password']);
    this.cacheManager.del(USER_LIST_CACHE_KEY);
    return newUser;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    //TODO: update slug if name changes
    const isAdmin = this.isAdmin();
    const loggedUser = this.getLoggedUser();
    if (!isAdmin && loggedUser?.id !== id) {
      throw new NotFoundException('Unauthorized');
    }
    const user = await this.findOne(id);//throw not found exception if not found
    const updatedUser = {
      ...user,
      ...updateUserDto,
    };
    if (updateUserDto.password) {
      updatedUser.password = bcrypt.hashSync(updateUserDto.password, PASSWORD_SALT_ROUNDS);
    }
    const { resource } = await this.usersContainer.item(user.id).replace(updatedUser);
    const newUser = FormatCosmosItem.cleanDocument(resource, ['password']);
    this.cacheManager.del(USER_LIST_CACHE_KEY);
    return newUser;
  }

  // async remove(id: string) {
  //   try {
  //     const user = await this.findOne(id);//throw not found exception if not found
  //     await this.usersContainer.item(user.id, user.id).delete();
  //     this.cacheManager.del(USER_LIST_CACHE_KEY);
  //     return null;
  //   } catch (error) {
  //     this.logger.error(error.message);
  //   }
  // }

  async updateStatus({ id, isActive }: { id: string, isActive: boolean }) {
    const user = await this.findOne(id);//throw not found exception if not found
    const updatedUser = {
      ...user,
      isActive,
    };
    const { resource } = await this.usersContainer.item(user.id).replace(updatedUser);
    const newUser = FormatCosmosItem.cleanDocument(resource, ['password']);
    this.cacheManager.del(USER_LIST_CACHE_KEY);
    return newUser;
  }

  getLoggedUser(): User | null {
    const loggedUser = this.request['loggedUser'];
    return loggedUser ?? null;
  }

  isAdmin() {
    const loggedUser = this.getLoggedUser();
    return loggedUser && loggedUser.role === Role.ADMIN;
  }

  revokeWhenIsNotAdmin() {
    if (!this.isAdmin()) {
      throw new NotFoundException('Unauthorized');
    }
  }

  private async getSlugs(): Promise<string[]> {
    const querySpec = {
      query: 'SELECT c.slug FROM c',
      parameters: [],
    };
    const { resources } = await this.usersContainer.items.query<{ slug: string }>(querySpec).fetchAll();
    return resources.map(u => u.slug);
  }

  async updateSlugs() {
    const querySpec = {
      query: 'SELECT * FROM c',
      parameters: [],
    };
    const { resources } = await this.usersContainer.items.query<User>(querySpec).fetchAll();
    const slugs = resources.map(u => u.slug || "");
    for (const user of resources) {
      const uniqueSlug = generateUniqueSlug({ title: user.name, slugs });
      user.slug = uniqueSlug;
      this.usersContainer.item(user.id).replace(user);
    }
    return 'ok';
  }
}
