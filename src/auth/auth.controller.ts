import { Controller, Get, Post, Body, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { SignInDto } from './dto/sign-in.dto';
import { AuthGuard } from './guards/auth.guard';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './entities/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SendResetPasswordOtpDto } from './dto/send-reset-password-otp.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService,
  ) { }

  @ApiResponse({
    status: 200,
    description: 'Login successful.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @ApiResponse({
    status: 200,
    description: 'Register successful.',
  })
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @ApiResponse({
    status: 200,
    description: 'Retrieve authenticated user.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  @UseGuards(AuthGuard)
  @Get('authenticate')
  async getAuthenticatedUser(@Request() req: any) {
    return this.authService.getAuthenticatedUser(req);
  }

  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 200,
    description: 'Send reset password OTP.',
  })
  @Post('send-reset-password-otp')
  sendResetPasswordOtp(@Body() sendResetPasswordOtpDto: SendResetPasswordOtpDto) {
    return this.authService.sendResetPasswordOtp(sendResetPasswordOtpDto.email);
  }

  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 200,
    description: 'Reset password.',
  })
  @Post('reset-password')
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
}