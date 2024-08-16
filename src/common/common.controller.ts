import { Body, Controller, Post } from '@nestjs/common';
import { AlgoliaService } from './services/algolia.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CommonService } from './common.service';
import { SendOTPDto } from './dtos/send-otp.dto';
import { OtpService } from './services/otp.service';

@ApiTags('Common')
@Controller('common')
export class CommonController {
    constructor(
        private readonly algoliaService: AlgoliaService,
        private readonly commonService: CommonService,
        private readonly otpService: OtpService,
    ) {}

    @Post('sync-algolia')
    syncAlgolia(){
        return this.algoliaService.syncAlgolia();
    }

    @ApiOperation({ summary: 'Send OTP' })
    @ApiResponse({ status: 200, description: 'OTP sent successfully' })
    @Post('send-otp')
    sendOtp(@Body() sendOtpDto: SendOTPDto){
        return this.otpService.sendOtp(sendOtpDto);
    }
}
