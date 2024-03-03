import { Injectable, NotFoundException } from '@nestjs/common';
import type { Container } from '@azure/cosmos';
import { Role, User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/azure-database';
import { usersSeeder } from 'src/db/seeders/users.seeder';
import { FormatCosmosItem } from 'src/common/helpers/format-cosmos-item.helper';
import { UpdateUserDto } from './dto/update-user.dto';

const PASSWORD_SALT_ROUNDS = 10;
@Injectable()
export class UsersService {

  constructor(
    @InjectModel(User)
    private readonly usersContainer: Container,
  ) { }

  async findAll(role: Role = Role.AUTHOR) {
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.role = @role order by c.createdAt DESC',
      parameters: [
        {
          name: '@role',
          value: role,
        },
      ],
    };
    const {resources} = await this.usersContainer.items.query<User>(querySpec).fetchAll();
    return resources.map(user => FormatCosmosItem.cleanDocument(user, ['password']));
  }
  
  async findOne(id: string) {
    console.log('findOne', id)
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
    return FormatCosmosItem.cleanDocument(resource, ['password']);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);//throw not found exception if not found
    const updatedUser = {
      ...user,
      ...updateUserDto,
    };
    if(updateUserDto.password){
      updatedUser.password = bcrypt.hashSync(updateUserDto.password, PASSWORD_SALT_ROUNDS);
    }
    const {resource} = await this.usersContainer.item(user.id).replace(updatedUser);
    return FormatCosmosItem.cleanDocument(resource, ['password']);
  }

  seed(){
    const users = usersSeeder();
    return Promise.all(users.map(user => this.usersContainer.items.create<User>(user)));
  }
}
