import { BadRequestException, Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import type { Container } from '@azure/cosmos';
import { Role, User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/azure-database';
import { FormatCosmosItem } from 'src/common/helpers/format-cosmos-item.helper';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApplicationLoggerService } from 'src/common/services/application-logger.service';
import { REQUEST } from '@nestjs/core';
import { generateUniqueSlug } from 'src/posts/helpers/generate-slug.helper';
import { FindUsersDto } from './dto/find-users.dto';
import { CountriesService } from 'src/common/services/countries.service';
import { Post } from 'src/posts/entities/post.entity';
import { UsersRepository } from 'src/repositories/services/users.repository';
import { PASSWORD_SALT_ROUNDS, ROLES_THAT_CAN_BE_REQUESTED } from './constants';
import { APP_ERRORS, ERROR_CODES } from 'src/common/constants/errors.constants';
import { Action, ChangeRoleRequestDto } from './dto/change-role-request.dto';
import { MailService } from 'src/common/services/mail.service';

@Injectable({ scope: Scope.REQUEST })
export class UsersService {

  constructor(
    private readonly countriesService: CountriesService,
    @InjectModel(User)
    private readonly usersContainer: Container,
    @InjectModel(Post)
    private readonly postsContainer: Container,
    private readonly logger: ApplicationLoggerService,
    @Inject(REQUEST) private request: Request,
    private readonly usersRepository: UsersRepository,
    private readonly mailService: MailService,
  ) { }

  async findAll(findUsersDto: FindUsersDto = {}) {
    this.logger.log(`retrieving users - ${JSON.stringify(findUsersDto)}`);
    const { roles: rolesString, onlyPendingRole } = findUsersDto;
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
      query: `
        SELECT * FROM c 
        where c.isActive = true 
        ${onlyPendingRole === 'true' ? 'AND IS_DEFINED(c.requestedRole) AND ARRAY_CONTAINS(@rolesThatCanBeRequested, c.requestedRole)' : ''}
        AND ARRAY_CONTAINS(@roles, c.role) 
        order by c.createdAt DESC
      `,
      parameters: [
        {
          name: '@roles',
          value: roles,
        },
        {
          name: '@rolesThatCanBeRequested',
          value: ROLES_THAT_CAN_BE_REQUESTED,
        }
      ],
    };
    const startAt = new Date();
    const { resources } = await this.usersContainer.items.query<User>(querySpec).fetchAll();
    this.logger.log(`query time findAll users ${(new Date().getTime() - startAt.getTime())}`);
    return resources.map(user => this.toJson(user));
  }

  async toggleActiveState(id: string) {
    const user = await this.findOne(id);
    return this.updateStatus({ id, isActive: !user.isActive });
  }

  async findOne(id: string) {
    try {
      const user = await this.getById(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return this.toJson(user);
    } catch (error) {
      this.logger.debug(`Error finding user, ${id}`);
      this.logger.log(error.message);
      throw error;
    }
  }

  async getById(id: string) {
    try {
      const { resource } = await this.usersContainer.item(id, id).read<User>();
      return resource;
    } catch (error) {
      return null;
    }
  }

  async getByIds(ids: string[]) {
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
    return resources.map(user => this.toJson(user));
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
    const extraData = await this.getExtraAuthorData(resources[0].id);
    return this.toJson(resources[0], extraData);
  }

  private async getExtraAuthorData(id: string) {
    const querySpecPosts = {
      query: `
        SELECT c.id, c.likes FROM c 
        WHERE c.userId = @id
        AND c.isActive = true
      `,
      parameters: [
        {
          name: '@id',
          value: id,
        },
      ],
    };
    const { resources: posts } = await this.postsContainer.items.query<{id: string, likes: number}>(querySpecPosts).fetchAll();
    console.log(posts);
    const likes = posts.reduce((acc, post) => acc + post.likes, 0);
    return {
      postsCount: posts.length,
      postLikes: likes,
    };
  }

  async create(createUserDto: CreateUserDto) {
    const user = await this.usersRepository.create(createUserDto);
    this.mailService.sendRegisterNotification({user});
    return this.toJson(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    //TODO: update slug if name changes
    //the user can't change its requested role, only an admin can do it, there is a separate endpoint for that
    delete updateUserDto.requestedRole;
    const isAdmin = this.isAdmin();
    const loggedUser = this.getLoggedUser();
    if (!isAdmin && loggedUser?.id !== id) {
      throw new NotFoundException('Unauthorized');
    }
    const user = await this.getById(id);
    if(!user){
      throw new NotFoundException('User not found');
    }
    const updatedUser = {
      ...user,
      ...updateUserDto,
    };
    if (updateUserDto.password) {
      updatedUser.password = bcrypt.hashSync(updateUserDto.password, PASSWORD_SALT_ROUNDS);
    }
    const { resource } = await this.usersContainer.item(user.id).replace(updatedUser);
    return this.toJson(resource as User);
  }

  async resetPassword(id: string, password: string) {
    this.logger.debug(`reset password for user ${id}`);
    const user = await this.getById(id);
    if(!user){
      throw new NotFoundException('User not found');
    }
    user.password = bcrypt.hashSync(password, PASSWORD_SALT_ROUNDS);
    const { resource } = await this.usersContainer.item(user.id).replace(user);
    return this.toJson(resource as User);
  }

  async acceptChangeRoleRequest(id: string, changeRoleRequestDto: ChangeRoleRequestDto){
    this.logger.debug(`accept change role request for user ${id}`);
    this.revokeWhenIsNotAdmin();
    const user = await this.getById(id);
    if(!user){
      throw new NotFoundException('User not found');
    }
    if(changeRoleRequestDto.action === Action.ACCEPT){
      if(!ROLES_THAT_CAN_BE_REQUESTED.includes(user.requestedRole)){
        throw new BadRequestException(APP_ERRORS[ERROR_CODES.INVALID_CHANGE_ROLE_REQUEST]);
      }
      user.role = user.requestedRole;
    } 
    delete user.requestedRole;
    const { resource } = await this.usersContainer.item(user.id, user.id).replace(user);
    this.logger.debug(`role changed for user ${id}`);
    return this.toJson(resource as User);
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
    return this.toJson(resource as User);
  }

  getLoggedUser() {
    const loggedUser = this.request['loggedUser'];
    return loggedUser ? this.toJson(loggedUser) : null;
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

  revokeWhenIsNotAdminOrOwner(id: string) {
    const loggedUser = this.getLoggedUser();
    this.logger.debug(`revokeWhenIsNotAdminOrOwner - validate ${id} against logged user ${loggedUser?.id}`);
    if (!this.isAdmin() && loggedUser?.id !== id) {
      throw new NotFoundException('Unauthorized');
    }
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

  toJson(user: User, extraData: any = {}) {
    user.country = this.countriesService.getCountry(user.countryCode);
    return {
      ...FormatCosmosItem.cleanDocument(user, ['password']),
      ...extraData,
    };
  }
}
