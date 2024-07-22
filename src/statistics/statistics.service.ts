import { InjectModel } from '@nestjs/azure-database';
import { Inject, Injectable } from '@nestjs/common';
import { Visit, VisitType } from './entities/visit.entity';
import type { Container } from '@azure/cosmos';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ApplicationLoggerService } from 'src/common/services/application-logger.service';

const VISITS_WEB_COUNT_KEY = 'visits_web_count'; 

@Injectable()
export class StatisticsService {

    constructor(
        @InjectModel(Visit)
        private readonly visitsContainer: Container,
        @Inject(CACHE_MANAGER) 
        private readonly cacheManager: Cache,
        private readonly logger: ApplicationLoggerService,
    ) {
        // this.logger.setContext(StatisticsService.name);
    }
    
    async registerVisit() {
        this.logger.log('Registering visit');
        const visitsInCache = await this.cacheManager.get(VISITS_WEB_COUNT_KEY);
        if(visitsInCache) {
            this.logger.log('Incrementing visit count from cache');
            this.incrementVisitWebCount();
            return Number(visitsInCache) + 1;
        }else {
            this.logger.log('Incrementing visit count from db');
            const visits = this.incrementVisitWebCount();
            return visits;
        }
    }

    async incrementVisitWebCount() {
        const querySpec = {
            query: 'SELECT * FROM c WHERE c.type = @type',
            parameters: [
                {
                    name: '@type',
                    value: VisitType.WEB,
                },
            ],
        }
        let item: Visit;
        const { resources } = await this.visitsContainer.items.query<Visit>(querySpec).fetchAll();
        if(resources.length === 0) {
            const { resource } = await this.visitsContainer.items.create({
                type: VisitType.WEB,
                count: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            item = resource;
        } else {
            item = resources[0];
        }
        const newCount = item.count + 1;
        item.count = newCount;
        item.updatedAt = new Date();
        this.visitsContainer.items.upsert<Visit>(item);
        this.cacheManager.set(VISITS_WEB_COUNT_KEY, newCount);
        return newCount;
    }
}
