import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import OpenAI from 'openai';
import { Stream } from 'openai/streaming';
import { ChatCompletionMessageParam, ChatCompletionRole } from 'openai/resources';
import { ApplicationLoggerService } from 'src/common/services/application-logger.service';
import { interval, map, Observable } from 'rxjs';

export enum EventSourceType {
    PARTIAL_CONTENT = 'partial-content',
    END = 'end',
}

interface Options {
    voice?: string;
    input: string;
}

const SYSTEM_EXPERT_PROMPT = 'Eres un investigador español experimentado, experto en interpretar y responder preguntas basadas en las fuentes proporcionadas. Utilizando el contexto proporcionado entre las etiquetas <context></context>, genera una respuesta concisa para una pregunta rodeada con las etiquetas <question></question>. Debes usar únicamente información del contexto. Usa un tono imparcial y periodístico. No repitas texto. Si no hay nada en el contexto relevante para la pregunta en cuestión, simplemente di "No lo sé". No intentes inventar una respuesta. Cualquier cosa entre los siguientes bloques html context se recupera de un banco de conocimientos, no es parte de la conversación con el usuario.';

@Injectable()
export class OpenaiService {
    private openai: OpenAI;
    private apiKey = process.env.OPENAI_API_KEY;

    constructor(
        private readonly logger: ApplicationLoggerService,
        private eventEmitterService: EventEmitter2,
    ) {
        try {
            this.logger.debug(this.apiKey);
            this.openai = new OpenAI({
                apiKey: this.apiKey,
            });
            this.logger.debug('Openai service initialized');
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

    getCompletion(messages: ChatCompletionMessageParam[]): Observable<{ type?: string, data?: { content: string, role: ChatCompletionRole } }> {
        return new Observable((subscriber) => {
            this.openai.chat.completions.create({
                model: "gpt-3.5-turbo-16k",
                messages: [
                    { role: "system", content: "You are a helpful assistant." },
                    ...messages
                ],
                stream: true
            })
                .then(async (response) => {
                    for await (const chunk of response as Stream<OpenAI.ChatCompletionChunk>) {
                        console.log({ tokens: chunk.usage?.total_tokens });
                        if (chunk.choices[0].finish_reason === 'stop') {
                            subscriber.next({ type: EventSourceType.END });
                            subscriber.complete();
                            return;
                        }
                        const content = chunk.choices[0].delta.content;
                        const role = chunk.choices[0].delta.role;
                        subscriber.next({ type: EventSourceType.PARTIAL_CONTENT, data: { content, role } });
                    }
                });
        });
    }

    cont = 1;
    askAbout({
        context,
        question,
    }: {
        context: string,
        question: string,
    }) {
        return new Observable((subscriber) => {
            this.openai.chat.completions.create({
                model: 'gpt-3.5-turbo-0125',
                stream: true,
                messages: [
                    {
                        role: 'system',
                        content: SYSTEM_EXPERT_PROMPT
                    },
                    {
                        role: 'user',
                        content: `<context>${context}</context><question>${question}</question>`
                    }
                ]
            })
                .then(async (response) => {
                    for await (const chunk of response as Stream<OpenAI.ChatCompletionChunk>) {
                        console.log('emitiendo ', chunk.choices[0].delta.content);
                        if (chunk.choices[0].finish_reason === 'stop') {
                            subscriber.next({ data: '___END___' });
                            subscriber.complete();
                            return;
                        }
                        subscriber.next({ data: chunk.choices[0].delta.content });
                    }
                });
        });
    }

    getStreamMessages(): Observable<OpenAI.ChatCompletionChunk> {
        return new Observable((subscribe) => {
            const listener = (message: OpenAI.ChatCompletionChunk) => {
                if (message.choices[0].finish_reason === 'stop') {
                    subscribe.next(message); // sent the last message event
                    return subscribe.complete(); // close the connection
                }
                console.log('next observable')
                subscribe.next(message);
            };
            this.eventEmitterService.on('streamMessage', listener);
            return () => this.eventEmitterService.off('streamMessage', listener);
        });
    }
}
