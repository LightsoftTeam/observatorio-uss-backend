export function responseSSE(
    { request }: { request: Request },
    callback: (sendEvent: (data: any) => void) => Promise<void>,
    response: any
) {
    const body = new ReadableStream({
        async start(controller) {
            // Text encoder for converting strings to Uint8Array
            const encoder = new TextEncoder();

            // Send event to client
            const sendEvent = (data: any) => {
                const message = `data: ${JSON.stringify(data)}\n\n`;
                controller.enqueue(encoder.encode(message));
            };

            callback(sendEvent)

            // Handle the connection closing
            request.signal.addEventListener('abort', () => {
                controller.close();
            });
        }
    });
    return body;
    // const resp = response(body, {
    //     headers: {
    //         'Content-Type': 'text/event-stream',
    //         'Cache-Control': 'no-cache',
    //         Connection: 'keep-alive'
    //     }
    // });
    // console.log(response.headers);
    // return resp;
}