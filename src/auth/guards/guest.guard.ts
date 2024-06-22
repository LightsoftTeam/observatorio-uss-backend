import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from './auth.guard';

@Injectable()
export class GuestGuard implements CanActivate {

  constructor(
    private readonly authGuard: AuthGuard,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await this.authGuard.canActivate(context);
    } finally {
      return true;
    }
  }
}
