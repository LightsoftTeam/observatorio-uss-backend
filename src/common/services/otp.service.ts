import { BadRequestException, Injectable } from '@nestjs/common';
import { ApplicationLoggerService } from './application-logger.service';
import { MailService } from './mail.service';
import { SendOTPDto } from '../dtos/send-otp.dto';
import { Generator } from '../helpers/generator.helper';
import { APP_ERRORS, ERROR_CODES } from '../constants/errors.constants';
// const Redis = require('ioredis');

const OTP_CODE_LENGTH = 6;
const OTP_EXPIRATION_TIME = 300; // 5 minutes
const OTP_CACHE = {};

@Injectable()
export class OtpService {

    constructor(
        private readonly logger: ApplicationLoggerService,
        private readonly mailService: MailService,
    ) {
        this.logger.setContext(OtpService.name);
        // console.log(process.env.REDIS_PORT);
        // console.log(process.env.REDIS_HOST);
        // this.redisClient = new Redis({
        //     port: process.env.REDIS_PORT,
        //     host: process.env.REDIS_HOST,
        //     // password: this.configService.get('config.redisDB.key'),
        // });
    }

    async sendOtp(sendOTPDto: SendOTPDto) {
        const { email } = sendOTPDto;
        this.logger.log(`Sending OTP to ${email}`);
        const code = Generator.code(OTP_CODE_LENGTH);
        this.logger.log(`Generated OTP: ${code}`);
        try {
            this.mailService.sendVerificationCode({
                to: email,
                code,
            });
            this.logger.log(`storing OTP ${code} ${email} in cache for ${OTP_EXPIRATION_TIME} seconds`);
            OTP_CACHE[code] = email;
            return {
                email,
                ttl: OTP_EXPIRATION_TIME,
            };
        } catch (error) {
            this.logger.error(error);
            throw new Error('Error sending OTP');
        }
    }

    async verifyOtp({ code, email }: { code: string, email: string }) {
        const verificationOtpIsActive = (process.env.OTP_VERIFICATION_IS_ACTIVE || 'true') === 'true';
        this.logger.log(`verifying otp code ${code} for email ${email}`);
        console.log(OTP_CACHE);
        const verifiedEmail = OTP_CACHE[code];
        this.logger.log(`Verified email: ${verifiedEmail}`);
        this.logger.log(`Verification Otp is active: ${verificationOtpIsActive}`);
        const isValid = (email === verifiedEmail || !verificationOtpIsActive);
        if (!isValid) {
            throw new BadRequestException(APP_ERRORS[ERROR_CODES.INVALID_OTP]);
        }
        return isValid;
    }
}
