import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { readFile } from 'fs';
import { CountriesService } from './common/services/countries.service';
import { MailService } from './common/services/mail.service';
import { MigrationService } from './training/services/migration.service';

@ApiTags('v1')
@Controller()
export class AppController {
  constructor(
    private countriesService: CountriesService,
    private mailService: MailService,
    // private migrationsService: MigrationService
  ) {}

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

  @Get('countries')
  getCountries(){
    return this.countriesService.findAll();
  }

  @Post('send-massive-mail')
  sendMassiveMail() {
    // const emails = [
    //   // 'renattofaridper@gmail.com',
    //   'joseluis.aries22@gmail.com'
    // ];
    // const users = emails.map((email) => ({
    //   name: 'Renatto Farid',
    //   email,
    // }));
    // const password = '123456789';
    // for (const user of users) {
    //   this.mailService.sendNewAccountWithPassword({
    //     user,
    //     password
    //   });
    // }

    return {
      message: 'Emails sent successfully',
    };
  }
}
