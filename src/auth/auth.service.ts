import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SignInDto } from './dto/sign-in.dto';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { LoginResponse } from './types/login-response';
import { RegisterDto } from './entities/register.dto';
import { OtpService } from 'src/common/services/otp.service';
import { Role, User } from 'src/users/entities/user.entity';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { FormatCosmosItem } from 'src/common/helpers/format-cosmos-item.helper';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly otpService: OtpService,
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

  async register(registerDto: RegisterDto): Promise<LoginResponse>{
    const { user, verificationCode } = registerDto;
    await this.otpService.verifyOtp({code: verificationCode, email: user.email});
    const newUser: CreateUserDto = {
      ...registerDto.user,
      role: Role.USER,
    }
    const userCreated = await this.userService.create(newUser);
    return {
      user: FormatCosmosItem.cleanDocument(userCreated, ['password']),
      token: this.generateToken(userCreated),
    }
  }

  async getAuthenticatedUser(req: any): Promise<Partial<User>> {
    const user = req['loggedUser'];
    return user;
  }

  generateToken(user: Partial<User>) {
    const payload = { sub: user.id, email: user.email };
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
    });
  }
}
