import { ConsoleLogger, Inject, Injectable, LogLevel, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { TelemetryClient } from 'applicationinsights';
import { SeverityLevel } from 'applicationinsights/out/Declarations/Contracts';

@Injectable({
    scope: Scope.TRANSIENT
})
export class ApplicationLoggerService extends ConsoleLogger {

    constructor(
        @Inject('ApplicationInsight') private readonly appInsights: TelemetryClient,
        @Inject(REQUEST) private request: any
    ) {
        super();
    }

    log(message: any) {
        const formattedMessage = typeof message === 'string' ? message : JSON.stringify(message);
        this.appInsights.trackTrace({
            message: formattedMessage, properties: {
                ...this.request.context?.executionContext,
            }, severity: SeverityLevel.Information
        });
        super.log(message);
    }
    error(message: any) {
        const formattedMessage = typeof message === 'string' ? message : JSON.stringify(message);
        this.appInsights.trackException({ exception: new Error(formattedMessage), properties: {} });
        super.error(message);
    }
    warn(message: any) {
        const formattedMessage = typeof message === 'string' ? message : JSON.stringify(message);
        this.appInsights.trackTrace({ message: formattedMessage, properties: {}, severity: SeverityLevel.Warning });
        super.warn(message);
    }
    debug(message: any) {
        const formattedMessage = typeof message === 'string' ? message : JSON.stringify(message);
        this.appInsights.trackTrace({ message: formattedMessage, properties: {}, severity: SeverityLevel.Verbose });
        super.debug(message);
    }
    verbose(message: any) {
        throw new Error('Method not implemented.');
    }
    fatal(message: any) {
        throw new Error('Method not implemented.');
    }
    setLogLevels(levels: LogLevel[]) {
        throw new Error('Method not implemented.');
    }
}
