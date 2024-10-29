import { Global, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtService, JwtModule } from '@nestjs/jwt';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { PostsModule } from 'src/posts/posts.module';
import { AuthGuard } from './guards/auth.guard';
import { OtpService } from 'src/common/services/otp.service';
import { UserTokensService } from './services/user-tokens.service';

@Global()
@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtService, ConfigService, UsersService, OtpService, AuthGuard, UserTokensService],
  imports: [
    UsersModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          global: true,
          secret: configService.get<string>('JWT_SECRET'),
          signOptions: { expiresIn: '180d' },
        }
      },
      inject: [ConfigService],
    }),
    PostsModule
  ],
  exports: [
    JwtModule,
    JwtService,
    UsersService,
    AuthGuard
  ]
})
export class AuthModule {}