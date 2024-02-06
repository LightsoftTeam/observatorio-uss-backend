import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) { }
  
  findOne(id: number) {
    return this.usersRepository.findOneBy({id});
  }

  findByEmail(email: string) {
    return this.usersRepository.findOneBy({email});
  }
}
