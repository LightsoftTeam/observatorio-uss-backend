import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { readFile } from 'fs';

@ApiTags('v1')
@Controller()
export class AppController {
  constructor() {}

  @Get('/swagger')
  getSwagger() {
    return new Promise((resolve, reject) => {
      readFile('swagger-spec.json', 'utf8', (err, data) => {
        if (err) {
          reject(err);
        }
        resolve(JSON.parse(data));
      });
    });
  }
}
