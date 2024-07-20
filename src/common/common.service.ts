import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
import { Generator } from "./helpers/generator.helper";
import { MailService } from "./services/mail.service";
import { ApplicationLoggerService } from "./services/application-logger.service";
import { SendOTPDto } from "./dtos/send-otp.dto";

const OTP_CODE_LENGTH = 6;
const OTP_EXPIRATION_TIME = 300; // 5 minutes

@Injectable()
export class CommonService {
    constructor(
        @Inject(CACHE_MANAGER) 
        private readonly cacheManager: Cache,
        private readonly logger: ApplicationLoggerService,
        private readonly mailService: MailService,
    ) {
        this.logger.setContext(CommonService.name);
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
            this.cacheManager.set(email, code, OTP_EXPIRATION_TIME);
            return {
                email,
                ttl: OTP_EXPIRATION_TIME,
            };
        } catch (error) {
            this.logger.error(error);
            throw new Error('Error sending OTP');
        }
    }
}