import { Injectable } from '@nestjs/common';
import { COUNTRIES_MAP } from '../constants/countries';

export interface Country{
    code: string;
    name: string;
    icon: string;
}

@Injectable()
export class CountriesService {
    countriesMap = COUNTRIES_MAP;

    findAll(): Country[] {
        return Object.entries(this.countriesMap).map(([code, name]) => {
            const icon = this.getIcon(code);
            return {
                code,
                name,
                icon,
            }
        });
    }

    getCountry(code: string): Country | null {
        const name = this.countriesMap[code];
        if(!name){
            return null;
        }
        return {
            code,
            name,
            icon: this.getIcon(code),
        }
    }

    getIcon(code: string): string {
        return `https://raw.githubusercontent.com/hampusborgos/country-flags/main/png250px/${code.toLowerCase()}.png`;
    }
}
