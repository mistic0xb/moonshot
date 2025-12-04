import type { ChatMessage } from "../types/types";
import { getPool } from "./nostr/pool";
import { DEFAULT_RELAYS } from "./nostr/relayConfig";

const DB_NAME = "nostr_nip04_messages";
const DB_VERSION = 1;
const STORE_NAME = "messages";

let db: IDBDatabase | null = null;

async function initDB(): Promise<IDBDatabase> {
    if (db) return db;

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        request.onupgradeneeded = (event) => {
            const database = (event.target as IDBOpenDBRequest).result;
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                const objectStore = database.createObjectStore(STORE_NAME, { keyPath: "id" });
                objectStore.createIndex("conversationKey", "conversationKey", { unique: false });
                objectStore.createIndex("timestamp", "timestamp", { unique: false });
            }
        };
    });
}

async function saveMessageToDB(message: ChatMessage, conversationKey: string): Promise<void> {
    try {
        const database = await initDB();
        const transaction = database.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        await new Promise<void>((resolve, reject) => {
            const request = store.put({ ...message, conversationKey });
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (err) {
        console.error("Failed to save to IndexedDB:", err);
    }
}

async function loadMessagesFromDB(myPubkey: string, otherPubkey: string, moonshotId?: string): Promise<ChatMessage[]> {
    try {
        const database = await initDB();
        const transaction = database.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index("conversationKey");
        const conversationKey = getConversationKey(myPubkey, otherPubkey, moonshotId);

        return new Promise((resolve, reject) => {
            const request = index.getAll(conversationKey);
            request.onsuccess = () => {
                const results = request.result || [];
                const messages = results.map((r: any) => {
                    const { conversationKey: _, ...message } = r;
                    return message as ChatMessage;
                }).sort((a, b) => a.timestamp - b.timestamp);
                resolve(messages);
            };
            request.onerror = () => reject(request.error);
        });
    } catch (err) {
        console.error("Failed to load from IndexedDB:", err);
        return [];
    }
}

function getConversationKey(pubkey1: string, pubkey2: string, moonshotId?: string): string {
    const sorted = [pubkey1, pubkey2].sort();
    return moonshotId ? `${sorted[0]}_${sorted[1]}_${moonshotId}` : `${sorted[0]}_${sorted[1]}`;
}

function getNip04() {
    if (!window.nostr?.nip04) {
        throw new Error("NIP-04 not supported. Please update your Nostr extension.");
    }
    return window.nostr.nip04;
}

export async function sendNip04Message(
    recipientPubkey: string,
    messageContent: string,
    moonshotId?: string,
    interestId?: string
): Promise<string> {
    if (!window.nostr) {
        throw new Error("Nostr extension not found.");
    }

    try {
        const nip04 = getNip04();
        const myPubkey = await window.nostr.getPublicKey();
        const encryptedContent = await nip04.encrypt(recipientPubkey, messageContent);

        const unsignedEvent = {
            kind: 4,
            pubkey: myPubkey,
            created_at: Math.floor(Date.now() / 1000),
            tags: [
                ["p", recipientPubkey],
                ...(moonshotId ? [["moonshot", moonshotId]] : []),
                ...(interestId ? [["interest", interestId]] : [])
            ],
            content: encryptedContent,
        };

        const signedEvent = await window.nostr.signEvent(unsignedEvent);
        const pool = getPool();
        const pubs = pool.publish(DEFAULT_RELAYS, signedEvent);

        await Promise.race([
            Promise.all(pubs),
            new Promise(resolve => setTimeout(resolve, 5000))
        ]);

        const message: ChatMessage = {
            id: signedEvent.id,
            senderPubkey: myPubkey,
            receiverPubkey: recipientPubkey,
            content: messageContent,
            timestamp: signedEvent.created_at * 1000,
            encrypted: true,
            moonshotId,
            interestId,
        };

        const conversationKey = getConversationKey(myPubkey, recipientPubkey, moonshotId);
        await saveMessageToDB(message, conversationKey);

        return signedEvent.id;
    } catch (error) {
        console.error("Failed to send message:", error);
        throw error;
    }
}

export async function fetchNip04Messages(
    otherPubkey: string,
    moonshotId?: string,
    limit: number = 100
): Promise<ChatMessage[]> {
    if (!window.nostr) {
        throw new Error("Nostr extension not found");
    }

    const myPubkey = await window.nostr.getPublicKey();
    const cachedMessages = await loadMessagesFromDB(myPubkey, otherPubkey, moonshotId);
    const pool = getPool();
    const messages: ChatMessage[] = [...cachedMessages];
    const seen = new Set<string>(cachedMessages.map(m => m.id));
    const conversationKey = getConversationKey(myPubkey, otherPubkey, moonshotId);

    return new Promise((resolve) => {
        const filters = [
            { kinds: [4], "#p": [myPubkey], authors: [otherPubkey], limit },
            { kinds: [4], "#p": [otherPubkey], authors: [myPubkey], limit }
        ];

        let completedSubs = 0;
        const checkCompletion = () => {
            completedSubs++;
            if (completedSubs >= 2) {
                messages.sort((a, b) => a.timestamp - b.timestamp);
                resolve(messages);
            }
        };

        filters.forEach((filter) => {
            const sub = pool.subscribeMany(DEFAULT_RELAYS, filter, {
                async onevent(event) {
                    if (seen.has(event.id)) return;
                    seen.add(event.id);

                    try {
                        const receiverPubkey = event.tags.find(t => t[0] === "p")?.[1];
                        if (!receiverPubkey) return;

                        const moonshotTag = event.tags.find(t => t[0] === "moonshot");
                        const interestTag = event.tags.find(t => t[0] === "interest");

                        if (moonshotId && moonshotTag && moonshotTag[1] !== moonshotId) return;

                        const isRelevant =
                            (event.pubkey === myPubkey && receiverPubkey === otherPubkey) ||
                            (event.pubkey === otherPubkey && receiverPubkey === myPubkey);

                        if (!isRelevant) return;

                        const nip04 = getNip04();
                        const decryptedContent = event.pubkey === myPubkey
                            ? await nip04.decrypt(receiverPubkey, event.content)
                            : await nip04.decrypt(event.pubkey, event.content);

                        const message: ChatMessage = {
                            id: event.id,
                            senderPubkey: event.pubkey,
                            receiverPubkey,
                            content: decryptedContent,
                            timestamp: event.created_at * 1000,
                            encrypted: true,
                            moonshotId: moonshotTag?.[1],
                            interestId: interestTag?.[1],
                        };

                        messages.push(message);
                        await saveMessageToDB(message, conversationKey);
                    } catch (error) {
                        console.error("Failed to decrypt:", error);
                    }
                },
                oneose() {
                    sub.close();
                    checkCompletion();
                },
            });

            setTimeout(() => {
                sub.close();
                checkCompletion();
            }, 10000);
        });
    });
}

export function subscribeToNip04Messages(
    onMessage: (message: ChatMessage) => void,
    moonshotId?: string
): () => void {
    if (!window.nostr) {
        throw new Error("Nostr extension not found");
    }

    const pool = getPool();
    const seen = new Set<string>();
    const subs: any[] = [];

    window.nostr.getPublicKey().then(async (myPubkey) => {
        const now = Math.floor(Date.now() / 1000);

        const incomingFilter = {
            kinds: [4],
            "#p": [myPubkey],
            since: now - 60,
        };

        const outgoingFilter = {
            kinds: [4],
            authors: [myPubkey],
            since: now - 60,
        };

        const incomingSub = pool.subscribeMany(DEFAULT_RELAYS, incomingFilter, {
            async onevent(event) {
                if (seen.has(event.id)) return;
                seen.add(event.id);

                try {
                    const receiverPubkey = event.tags.find(t => t[0] === "p")?.[1];
                    if (!receiverPubkey || receiverPubkey !== myPubkey) return;

                    const moonshotTag = event.tags.find(t => t[0] === "moonshot");
                    const interestTag = event.tags.find(t => t[0] === "interest");

                    if (moonshotId && moonshotTag && moonshotTag[1] !== moonshotId) return;

                    const nip04 = getNip04();
                    const decryptedContent = await nip04.decrypt(event.pubkey, event.content);

                    const message: ChatMessage = {
                        id: event.id,
                        senderPubkey: event.pubkey,
                        receiverPubkey,
                        content: decryptedContent,
                        timestamp: event.created_at * 1000,
                        encrypted: true,
                        moonshotId: moonshotTag?.[1],
                        interestId: interestTag?.[1],
                    };

                    const conversationKey = getConversationKey(myPubkey, event.pubkey, moonshotId);
                    await saveMessageToDB(message, conversationKey);
                    onMessage(message);
                } catch (error) {
                    console.error("Failed to process incoming:", error);
                }
            },
            oneose() { },
        });

        const outgoingSub = pool.subscribeMany(DEFAULT_RELAYS, outgoingFilter, {
            async onevent(event) {
                if (seen.has(event.id)) return;
                seen.add(event.id);

                try {
                    const receiverPubkey = event.tags.find(t => t[0] === "p")?.[1];
                    if (!receiverPubkey) return;

                    const moonshotTag = event.tags.find(t => t[0] === "moonshot");
                    const interestTag = event.tags.find(t => t[0] === "interest");

                    if (moonshotId && moonshotTag && moonshotTag[1] !== moonshotId) return;

                    const nip04 = getNip04();
                    const decryptedContent = await nip04.decrypt(receiverPubkey, event.content);

                    const message: ChatMessage = {
                        id: event.id,
                        senderPubkey: event.pubkey,
                        receiverPubkey,
                        content: decryptedContent,
                        timestamp: event.created_at * 1000,
                        encrypted: true,
                        moonshotId: moonshotTag?.[1],
                        interestId: interestTag?.[1],
                    };

                    const conversationKey = getConversationKey(myPubkey, receiverPubkey, moonshotId);
                    await saveMessageToDB(message, conversationKey);
                    onMessage(message);
                } catch (error) {
                    console.error("Failed to process outgoing:", error);
                }
            },
            oneose() { },
        });

        subs.push(incomingSub, outgoingSub);
    });

    return () => subs.forEach(sub => sub.close());
}