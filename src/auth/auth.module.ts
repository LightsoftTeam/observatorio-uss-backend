import { Global, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtService, JwtModule } from '@nestjs/jwt';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { CommonModule } from 'src/common/common.module';
import { PostsModule } from 'src/posts/posts.module';

@Global()
@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtService, ConfigService, UsersService],
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
    CommonModule,
    PostsModule
  ],
  exports: [
    JwtModule,
    JwtService,
    UsersService
  ]
})
export class AuthModule {}