import { Controller, Post } from '@nestjs/common';
import { AlgoliaService } from './services/algolia.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Common')
@Controller('common')
export class CommonController {
    constructor(
        private readonly algoliaService: AlgoliaService
    ) {}

    @Post('sync-algolia')
    syncAlgolia(){
        return this.algoliaService.syncAlgolia();
    }
}
