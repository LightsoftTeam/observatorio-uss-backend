import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ApplicationLoggerService } from 'src/common/services/application-logger.service';

interface Options {
    voice?: string;
    input: string;
}

@Injectable()
export class OpenaiService {
    private openai: OpenAI;
    private apiKey = process.env.OPENAI_API_KEY;

    constructor(
        private readonly logger: ApplicationLoggerService,
    ) {
        console.log(this.apiKey);
        this.openai = new OpenAI({
            apiKey: this.apiKey,
        });
    }

    async getAudioFromText(
        { input, voice }: Options,
    ) {
        const voices = {
            nova: 'nova',
            alloy: 'alloy',
            echo: 'echo',
            fable: 'fable',
            onyx: 'onyx',
            shimmer: 'shimmer',
        };

        const startDate = new Date();
        const response = await this.openai.audio.speech.create({
            model: "tts-1",
            voice: voices[voice] ?? voices.alloy,
            input
        });
        this.logger.debug(`Audio from openai retrieved in ${new Date().getTime() - startDate.getTime()}ms`);

        //armar buffer 
        const buffer = Buffer.from(await response.arrayBuffer());
        return buffer;
    };
}
