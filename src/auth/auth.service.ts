import { Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
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
import { ApplicationLoggerService } from 'src/common/services/application-logger.service';
import { v4 as uuidv4 } from 'uuid';
import { TokenReason, UserToken } from 'src/common/entities/user-token.entity';
import { UserTokensService } from './services/user-tokens.service';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly otpService: OtpService,
    private readonly logger: ApplicationLoggerService,
    private readonly userTokensService: UserTokensService,
  ) { }

  async signIn({ email, password: passwordPayload }: SignInDto): Promise<LoginResponse> {
    try {
      this.logger.debug(`Sign in attempt for ${email}`);
      const user = await this.userService.findByEmail(email);
      if (!user) {
        throw new UnauthorizedException();
      }
      if(!user.password){
        throw new InternalServerErrorException('User password is not set, please contact support');
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
        this.logger.debug(`Error getting token ${error.message}`);
        throw error;
      }
    } catch (error) {
      this.logger.debug(error.message);
      throw error;
    }
  }

  async register(registerDto: RegisterDto): Promise<LoginResponse> {
    const { user, verificationCode } = registerDto;
    await this.otpService.verifyOtp({ code: verificationCode, email: user.email });
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

  async sendResetPasswordOtp(email: string) {
    const token = uuidv4();
    const user = await this.userService.findByEmail(email);
    if(!user){
      throw new NotFoundException('User not found');
    }
    const now = new Date();
    const userToken: UserToken = {
      createdAt: now,
      userId: user.id,
      token,
      reason: TokenReason.PASSWORD_RESET,
      expiresAt: new Date(now.getTime() + 1000 * 60 * 5),
    } 
    await this.userTokensService.sendResetPasswordOtp(email);
    return {
      message: 'OTP sent successfully'
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, password } = resetPasswordDto;
    const { userId } = await this.userTokensService.validateAndGetUserToken({ token, reason: TokenReason.PASSWORD_RESET });
    await this.userService.resetPassword(userId, password);
    return {
      message: 'Password reset successfully'
    }
  }
}
