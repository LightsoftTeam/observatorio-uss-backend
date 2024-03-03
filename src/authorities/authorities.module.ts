import { Module } from '@nestjs/common';
import { AuthoritiesService } from './authorities.service';
import { AuthoritiesController } from './authorities.controller';
import { Authority } from './entities/authority.entity';
import { AzureCosmosDbModule } from '@nestjs/azure-database';

@Module({
  controllers: [AuthoritiesController],
  providers: [AuthoritiesService],
  imports: [
    // Import the `CosmosModule` to use the `@InjectModel` decorator
    AzureCosmosDbModule.forFeature([{dto: Authority}]),
  ]
})
export class AuthoritiesModule {}
