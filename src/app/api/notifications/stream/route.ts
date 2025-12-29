import { appEmitter, EVENTS } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET() {
    let cleanup: () => void;

    const stream = new ReadableStream({
        start(controller) {
            const sendEvent = (event: string, data: any) => {
                try {
                    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
                    controller.enqueue(new TextEncoder().encode(message));
                } catch (e) {
                    // Skip if controller is closed
                }
            };

            const onOrderCreated = (data: any) => sendEvent(EVENTS.ORDER_CREATED, data);
            const onOrderUpdated = (data: any) => sendEvent(EVENTS.ORDER_UPDATED, data);
            const onOrderClosed = (data: any) => sendEvent(EVENTS.ORDER_CLOSED, data);

            appEmitter.on(EVENTS.ORDER_CREATED, onOrderCreated);
            appEmitter.on(EVENTS.ORDER_UPDATED, onOrderUpdated);
            appEmitter.on(EVENTS.ORDER_CLOSED, onOrderClosed);

            const heartbeat = setInterval(() => {
                try {
                    controller.enqueue(new TextEncoder().encode(": heartbeat\n\n"));
                } catch (e) {
                    // Skip if controller is closed
                }
            }, 30000);

            cleanup = () => {
                clearInterval(heartbeat);
                appEmitter.off(EVENTS.ORDER_CREATED, onOrderCreated);
                appEmitter.off(EVENTS.ORDER_UPDATED, onOrderUpdated);
                appEmitter.off(EVENTS.ORDER_CLOSED, onOrderClosed);
            };
        },
        cancel() {
            if (cleanup) cleanup();
        }
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
        },
    });
}
