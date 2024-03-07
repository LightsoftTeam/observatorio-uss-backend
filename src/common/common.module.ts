import { Module } from '@nestjs/common';
import { AlgoliaService } from './services/algolia.service';

@Module({
  providers: [AlgoliaService]
})
export class CommonModule {}
