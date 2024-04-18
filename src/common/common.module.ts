import { Module } from '@nestjs/common';
import { AlgoliaService } from './services/algolia.service';
import { CommonController } from './common.controller';

@Module({
  providers: [AlgoliaService],
  controllers: [CommonController]
})
export class CommonModule {}
