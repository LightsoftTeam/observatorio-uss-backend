import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SignInDto } from './dto/sign-in.dto';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { LoginResponse } from './types/login-response';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signIn({ email, password: passwordPayload }: SignInDto): Promise<LoginResponse> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException();
    }
    const isPasswordValid = await bcrypt.compare(
      passwordPayload,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException();
    }
    delete user.password;
    const payload = { sub: user.id, email: user.email };
    try {
      const token = await this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
    return {
      user,
      token,
    };    
    } catch (error) {
      console.log(error.message)
    }
  }
}
