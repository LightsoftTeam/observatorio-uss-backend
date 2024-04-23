import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/entities/user.entity';
import { FormatCosmosItem } from 'src/common/helpers/format-cosmos-item.helper';

export type LoggedUser = Partial<User>;

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    ){}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const { sub } = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      const startDate = new Date().getTime();
      const user = await this.usersService.findOne(sub);
      const endDate = new Date().getTime();
      console.log('Time taken to get user in seconds : ', (endDate - startDate) / 1000);
      if (!user.isActive) {
        throw new UnauthorizedException();
      }
      request['loggedUser'] = FormatCosmosItem.cleanDocument(user, ['password']) as LoggedUser;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | null {
    //@ts-ignore
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : null;
  }
}
