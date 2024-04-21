import { Inject, Injectable, LogLevel, LoggerService } from '@nestjs/common';
import { TelemetryClient } from 'applicationinsights';
import { SeverityLevel } from 'applicationinsights/out/Declarations/Contracts';

@Injectable()
export class ApplicationLoggerService implements LoggerService {

    constructor(
        @Inject('ApplicationInsight') private readonly appInsights: TelemetryClient
    ) {}

    log(message: any, optionalParams: {[key: string]: any} = {}) {
        const formattedMessage = typeof message === 'string' ? message : JSON.stringify(message);
        this.appInsights.trackTrace({message: formattedMessage, properties: optionalParams, severity: SeverityLevel.Information});
        console.log(message);
    }
    error(message: any, optionalParams: {[key: string]: any} = {}) {
        const formattedMessage = typeof message === 'string' ? message : JSON.stringify(message);
        this.appInsights.trackException({exception: new Error(formattedMessage), properties: optionalParams});
        console.error(message);
    }
    warn(message: any, optionalParams: {[key: string]: any} = {}) {
        const formattedMessage = typeof message === 'string' ? message : JSON.stringify(message);
        this.appInsights.trackTrace({message: formattedMessage, properties: optionalParams, severity: SeverityLevel.Warning});
        console.warn(message);
    }
    debug?(message: any, optionalParams: {[key: string]: any} = {}) {
        const formattedMessage = typeof message === 'string' ? message : JSON.stringify(message);
        this.appInsights.trackTrace({message: formattedMessage, properties: optionalParams, severity: SeverityLevel.Verbose});
        console.debug(message);
    }
    verbose?(message: any, optionalParams: {[key: string]: any} = {}) {
        throw new Error('Method not implemented.');
    }
    fatal?(message: any, optionalParams: {[key: string]: any} = {}) {
        throw new Error('Method not implemented.');
    }
    setLogLevels?(levels: LogLevel[]) {
        throw new Error('Method not implemented.');
    }
}
