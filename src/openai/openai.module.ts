import { Module } from '@nestjs/common';
import { OpenaiService } from './openai.service';
import { OpenaiController } from './openai.controller';
import { CommonModule } from 'src/common/common.module';

@Module({
  controllers: [OpenaiController],
  providers: [OpenaiService],
  imports: [
    CommonModule,
  ]
})
export class OpenaiModule {}
