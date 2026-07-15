import crypto from "crypto";
import { WebSocket } from "ws";
import { User } from "./User";
import { SubscriptionManager } from "./SubscriptionManager";

export class UserManager {
    private static instance: UserManager;
    private users: Map<string, User> = new Map();

    private constructor() { }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new UserManager();
        }
        return this.instance;
    }

    public addUser(ws: WebSocket) {
        const id = this.getRandomId();
        const user = new User(id, ws);
        this.users.set(id, user);
        this.registerOnClose(ws, id);
        return user;
    }

    public getUser(id: string) {
        return this.users.get(id);
    }

    private registerOnClose(ws: WebSocket, id: string) {
        ws.on("close", () => {
            this.users.delete(id);
            SubscriptionManager.getInstance().userLeft(id);
        });
    }

    private getRandomId() {
        return crypto.randomUUID();
    }
}
