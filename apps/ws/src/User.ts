import { WebSocket } from "ws";
import { OutgoingMessage } from "./types/out";
import { SubscriptionManager } from "./SubscriptionManager";
import { IncomingMessage, SUBSCRIBE, UNSUBSCRIBE } from "./types/in";

export class User {
    private id: string;
    private ws: WebSocket;

    constructor(id: string, ws: WebSocket) {
        this.id = id;
        this.ws = ws;
        this.addListeners();
    }

    emit(message: OutgoingMessage) {
        this.ws.send(JSON.stringify(message));
    }

    private addListeners() {
        this.ws.on("message", (message: string) => {
            const parsedMessage: IncomingMessage = JSON.parse(message);

            if (parsedMessage.method === SUBSCRIBE) {
                parsedMessage.params.forEach(channel =>
                    SubscriptionManager.getInstance().subscribe(this.id, channel));
            }

            if (parsedMessage.method === UNSUBSCRIBE) {
                parsedMessage.params.forEach(channel =>
                    SubscriptionManager.getInstance().unsubscribe(this.id, channel));
            }
        });
    }
}
