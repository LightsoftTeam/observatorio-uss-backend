import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';
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
        try {
            this.logger.debug(this.apiKey);
            this.openai = new OpenAI({
                apiKey: this.apiKey,
            });
        } catch (error) {
            this.logger.error(`Error initializing openai service ${error.message}`);
            throw error;
        }
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

    async getCompletion(messages: ChatCompletionMessageParam[]) {
        const response = await this.openai.chat.completions.create({
            model: "gpt-3.5-turbo-16k",
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                ...messages
            ]
        });
        const { choices, usage } = response;
        const choice = choices[0];
        console.log({ choice });
        this.logger.debug(JSON.stringify(usage));
        return choice;
    }
}
