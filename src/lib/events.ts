import { EventEmitter } from "events";

class AppEventEmitter extends EventEmitter { }

// Use a global variable to ensure the emitter is a singleton even with Next.js HMR
const globalForApp = global as unknown as { appEmitter: AppEventEmitter };

export const appEmitter = globalForApp.appEmitter || new AppEventEmitter();

if (process.env.NODE_ENV !== "production") globalForApp.appEmitter = appEmitter;

export const EVENTS = {
    ORDER_CREATED: "ORDER_CREATED",
    ORDER_UPDATED: "ORDER_UPDATED",
    ORDER_CLOSED: "ORDER_CLOSED",
};
