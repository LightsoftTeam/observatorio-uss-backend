import { Body, Controller, Post } from '@nestjs/common';
import { AlgoliaService } from './services/algolia.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CommonService } from './common.service';
import { SendOTPDto } from './dtos/send-otp.dto';

@ApiTags('Common')
@Controller('common')
export class CommonController {
    constructor(
        private readonly algoliaService: AlgoliaService,
        private readonly commonService: CommonService
    ) {}

    @Post('sync-algolia')
    syncAlgolia(){
        return this.algoliaService.syncAlgolia();
    }

    @ApiOperation({ summary: 'Send OTP' })
    @ApiResponse({ status: 200, description: 'OTP sent successfully' })
    @Post('send-otp')
    sendOtp(@Body() sendOtpDto: SendOTPDto){
        return this.commonService.sendOtp(sendOtpDto);
    }
}
