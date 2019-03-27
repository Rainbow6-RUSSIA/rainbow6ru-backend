import fetch from 'node-fetch';

type Context = 'BOT' | 'UBI' | 'INTERNAL' | 'UNKNOWN';

export class Log {
    private webhook: string;

    public constructor(webhook?: string) {
        this.webhook = webhook;
    }

    public sendWebhook(body: any) {
        return fetch(this.webhook, {method: 'POST', body: JSON.stringify(body)});
    }

    public log(msg: any, context: Context = 'UNKNOWN') {
        console.log(`[${context}]`, msg);
    }

    public warn(msg: any, context: Context = 'UNKNOWN') {

    }

    public error(msg: any, context: Context = 'UNKNOWN') {

    }
}
