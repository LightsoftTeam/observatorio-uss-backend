import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
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

  findAll() {
    return this.usersRepository.find();
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