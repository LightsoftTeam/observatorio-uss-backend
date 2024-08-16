import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
import { ApplicationLoggerService } from "./services/application-logger.service";
import { SendOTPDto } from "./dtos/send-otp.dto";
import { OtpService } from "./services/otp.service";

@Injectable()
export class CommonService {
    constructor(
        private readonly logger: ApplicationLoggerService,
        private readonly otpService: OtpService,
    ) {
        this.logger.setContext(CommonService.name);
    }

    async sendOtp(sendOTPDto: SendOTPDto) {
        return this.otpService.sendOtp(sendOTPDto);
    }
}