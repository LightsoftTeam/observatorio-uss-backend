import { Injectable, NestInterceptor, ExecutionContext, CallHandler, NotFoundException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ApplicationLoggerService } from '../services/application-logger.service';

@Injectable()
export class GeneralInterceptor implements NestInterceptor {

    constructor(
        private readonly logger: ApplicationLoggerService,
    ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    this.logger.debug(`Request: ${JSON.stringify(request)}`);

    return next.handle();
  }
}