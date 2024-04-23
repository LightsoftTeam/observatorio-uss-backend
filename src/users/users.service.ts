import { Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
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
    @Inject(REQUEST) private request: Request
  ) { }

  async findAll(role?: Role) {
    const cachedUsers = await this.cacheManager.get<User[]>(USER_LIST_CACHE_KEY);
    if(cachedUsers){
      this.logger.log('retrieving users from cache findAll');
      return cachedUsers.filter(u => {
        if(role){
          return u.role === role;
        }
        return true;
      });
    }
    this.logger.log('retrieving users from db findAll')
    const querySpec = {
      query: 'SELECT * FROM c order by c.createdAt DESC',
      parameters: [],
    };
    const startAt = new Date();
    const {resources} = await this.usersContainer.items.query<User>(querySpec).fetchAll();
    this.logger.log(`query time findAll users ${(new Date().getTime() - startAt.getTime())}`);
    const users = resources.map(user => FormatCosmosItem.cleanDocument(user, ['password']));
    this.cacheManager.set(USER_LIST_CACHE_KEY, users, LONG_CACHE_TIME);
    return users.filter(u => {
      if(role){
        return u.role === role;
      }
      return true;
    });
  }
  
  async findOne(id: string) {
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.id = @id',
      parameters: [
        {
          name: '@id',
          value: id,
        },
      ],
    };
    const { resources } = await this.usersContainer.items.query<User>(querySpec).fetchAll();
    if(resources.length === 0){
      throw new NotFoundException('User not found');
    }
    return resources[0];
  }

  async findByIds(ids: string[]) {
    const querySpec = {
      query: 'SELECT c.id, c.name, c.image FROM c WHERE ARRAY_CONTAINS(@ids, c.id)',
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
    if(resources.length === 0){
      return null;
    }
    return resources[0];
  }

  async create(createUserDto: CreateUserDto) {
    const hashedPassword = bcrypt.hashSync(createUserDto.password, PASSWORD_SALT_ROUNDS);
    const user = {
      ...createUserDto,
      password: hashedPassword,
      role: createUserDto.role || Role.AUTHOR,
      isActive: true,
      createdAt: new Date(),
    };
    const {resource} = await this.usersContainer.items.create<User>(user);
    const newUser = FormatCosmosItem.cleanDocument(resource, ['password']);
    this.cacheManager.del(USER_LIST_CACHE_KEY);
    return newUser;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const isAdmin = this.isAdmin();
    const loggedUser = this.getLoggedUser();
    if(!isAdmin && loggedUser.id !== id){
      throw new NotFoundException('Unauthorized');
    }
    const user = await this.findOne(id);//throw not found exception if not found
    const updatedUser = {
      ...user,
      ...updateUserDto,
    };
    if(updateUserDto.password){
      updatedUser.password = bcrypt.hashSync(updateUserDto.password, PASSWORD_SALT_ROUNDS);
    }
    const {resource} = await this.usersContainer.item(user.id).replace(updatedUser);
    const newUser = FormatCosmosItem.cleanDocument(resource, ['password']);
    this.cacheManager.del(USER_LIST_CACHE_KEY);
    return newUser;
  }

  getLoggedUser() {
    const loggedUser = this.request['loggedUser'];
    if(!loggedUser){
      throw new NotFoundException('Not logged in.');
    }
    return loggedUser;
  }

  isAdmin() {
    const loggedUser = this.getLoggedUser();
    return loggedUser.role === Role.ADMIN;
  }

  revokeWhenIsNotAdmin() {
    if(!this.isAdmin()){
      throw new NotFoundException('Unauthorized');
    }
  }
}
