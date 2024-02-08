import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role, User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

const PASSWORD_SALT_ROUNDS = 10;
@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) { }

  findAll(role: Role = Role.AUTHOR) {
    return this.usersRepository.find({
      where: {
        role,
      },
      order: {
        createdAt: 'DESC'
      }
    });
  }
  
  findOne(id: number) {
    return this.usersRepository.findOneBy({id});
  }

  findByEmail(email: string) {
    return this.usersRepository.findOneBy({email});
  }

  create(createUserDto: CreateUserDto) {
    const hashedPassword = bcrypt.hashSync(createUserDto.password, PASSWORD_SALT_ROUNDS);
    return this.usersRepository.save({
      ...createUserDto,
      password: hashedPassword,
    });
  }
}
