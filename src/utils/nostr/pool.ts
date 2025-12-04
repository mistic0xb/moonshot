import { SimplePool } from "nostr-tools";

let poolInstance: SimplePool | null = null;

export function getPool(): SimplePool {
    if (!poolInstance) {
        poolInstance = new SimplePool();
    }
    return poolInstance;
}