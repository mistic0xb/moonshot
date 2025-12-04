// IN DEVELOPMENT....

import {
    finalizeEvent,
    getEventHash,
    getPublicKey,
    generateSecretKey,
    type Event,
    type UnsignedEvent
} from "nostr-tools";
import { getPool } from "./nostr";
import { DEFAULT_RELAYS } from "./nostr/relayConfig";
import type { ChatMessage } from "../types/types";


const DB_NAME = "nostr_nip17_messages";
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

function randomTimeSkew(): number {
    return Math.floor(Math.random() * 172800); // 0-48 hours
}

/**
 * Send a NIP-17 encrypted message
 */
export async function sendNip17Message(
    recipientPubkey: string,
    messageContent: string,
    moonshotId?: string,
    interestId?: string
): Promise<string> {
    if (!window.nostr) {
        throw new Error("Nostr extension not found.");
    }

    if (!window.nostr.nip44) {
        throw new Error("NIP-44 not supported. Please update your Nostr extension.");
    }

    try {
        const myPubkey = await window.nostr.getPublicKey();

        // STEP 1: Create the rumor (kind 14 - unsigned)
        const rumor: UnsignedEvent = {
            kind: 14,
            pubkey: myPubkey,
            created_at: Math.floor(Date.now() / 1000),
            tags: [
                ["p", recipientPubkey],
                ...(moonshotId ? [["moonshot", moonshotId]] : []),
                ...(interestId ? [["interest", interestId]] : [])
            ],
            content: messageContent,
        };

        const rumorId = getEventHash(rumor as any);
        const rumorWithId = { ...rumor, id: rumorId };

        // STEP 2: Create the seal (kind 13)
        const sealContent = await window.nostr.nip44.encrypt(
            recipientPubkey,
            JSON.stringify(rumorWithId)
        );

        const sealEvent: UnsignedEvent = {
            kind: 13,
            pubkey: myPubkey,
            created_at: Math.floor(Date.now() / 1000) - randomTimeSkew(),
            tags: [],
            content: sealContent,
        };

        const signedSeal = await window.nostr.signEvent(sealEvent);

        // STEP 3: Create gift wrap for RECIPIENT
        const recipientGiftWrap = await createGiftWrap(signedSeal, recipientPubkey);

        // STEP 4: Create gift wrap for SELF
        const selfGiftWrap = await createGiftWrap(signedSeal, myPubkey);

        // STEP 5: Publish both gift wraps
        const pool = getPool();
        const pubs = [
            ...pool.publish(DEFAULT_RELAYS, recipientGiftWrap),
            ...pool.publish(DEFAULT_RELAYS, selfGiftWrap)
        ];

        await Promise.race([
            Promise.all(pubs),
            new Promise(resolve => setTimeout(resolve, 5000))
        ]);

        // Cache the message
        const message: ChatMessage = {
            id: rumorId,
            senderPubkey: myPubkey,
            receiverPubkey: recipientPubkey,
            content: messageContent,
            timestamp: rumor.created_at * 1000,
            encrypted: true,
            moonshotId,
            interestId,
        };

        const conversationKey = getConversationKey(myPubkey, recipientPubkey, moonshotId);
        await saveMessageToDB(message, conversationKey);

        return rumorId;
    } catch (error) {
        console.error("Failed to send NIP-17 message:", error);
        throw error;
    }
}

/**
 * Create a gift wrap using an ephemeral key
 */
async function createGiftWrap(sealedEvent: Event, recipientPubkey: string): Promise<Event> {
    const ephemeralSecretKey = generateSecretKey();
    const ephemeralPubkey = getPublicKey(ephemeralSecretKey);

    // Use nostr-tools for encryption with ephemeral key
    const { encrypt, getConversationKey: getConvKey } = await import("nostr-tools/nip44");
    
    const conversationKey = getConvKey(ephemeralSecretKey, recipientPubkey);
    const giftWrapContent = encrypt(JSON.stringify(sealedEvent), conversationKey);

    const giftWrap: UnsignedEvent = {
        kind: 1059,
        pubkey: ephemeralPubkey,
        created_at: Math.floor(Date.now() / 1000) - randomTimeSkew(),
        tags: [["p", recipientPubkey]],
        content: giftWrapContent,
    };

    return finalizeEvent(giftWrap, ephemeralSecretKey);
}

/**
 * Fetch NIP-17 messages for a conversation
 */
export async function fetchNip17Messages(
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
        const filter = {
            kinds: [1059],
            "#p": [myPubkey],
            limit: limit,
        };

        let completed = false;
        const checkCompletion = () => {
            if (!completed) {
                completed = true;
                messages.sort((a, b) => a.timestamp - b.timestamp);
                resolve(messages);
            }
        };

        const sub = pool.subscribeMany(DEFAULT_RELAYS, filter, {
            async onevent(event) {
                try {
                    const message = await unwrapGiftWrap(event, myPubkey);
                    if (!message) return;
                    if (seen.has(message.id)) return;
                    seen.add(message.id);

                    // Filter by conversation partner
                    const isFromOther = message.senderPubkey === otherPubkey;
                    const isToOther = message.receiverPubkey === otherPubkey;
                    if (!isFromOther && !isToOther) return;

                    // Filter by moonshot
                    if (moonshotId && message.moonshotId && message.moonshotId !== moonshotId) return;

                    messages.push(message);
                    await saveMessageToDB(message, conversationKey);
                } catch (err) {
                    console.error("Failed to unwrap:", err);
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
}

/**
 * Unwrap a gift wrap and extract the message
 */
async function unwrapGiftWrap(
    giftWrapEvent: Event,
    myPubkey: string
): Promise<ChatMessage | null> {
    if (!window.nostr?.nip44) return null;

    try {
        const recipient = giftWrapEvent.tags.find(t => t[0] === "p")?.[1];
        if (recipient !== myPubkey) return null;

        // STEP 1: Decrypt gift wrap with ephemeral pubkey
        let sealJson: string;
        try {
            sealJson = await window.nostr.nip44.decrypt(
                giftWrapEvent.pubkey,
                giftWrapEvent.content
            );
        } catch (err) {
            return null;
        }

        const seal: Event = JSON.parse(sealJson);
        if (seal.kind !== 13) return null;

        // STEP 2: Decrypt seal with sender's pubkey
        let rumorJson: string;
        try {
            rumorJson = await window.nostr.nip44.decrypt(
                seal.pubkey,
                seal.content
            );
        } catch (err) {
            return null;
        }

        const rumor: any = JSON.parse(rumorJson);
        if (rumor.kind !== 14) return null;

        // Verify seal pubkey matches rumor pubkey (anti-spoofing)
        if (seal.pubkey !== rumor.pubkey) return null;

        const receiverPubkey = rumor.tags?.find((t: string[]) => t[0] === "p")?.[1];
        const moonshotId = rumor.tags?.find((t: string[]) => t[0] === "moonshot")?.[1];
        const interestId = rumor.tags?.find((t: string[]) => t[0] === "interest")?.[1];

        if (!receiverPubkey) return null;

        const message: ChatMessage = {
            id: rumor.id,
            senderPubkey: rumor.pubkey,
            receiverPubkey: receiverPubkey,
            content: rumor.content,
            timestamp: rumor.created_at * 1000,
            encrypted: true,
            moonshotId,
            interestId,
        };

        return message;
    } catch (error) {
        return null;
    }
}

/**
 * Subscribe to new NIP-17 messages in real-time
 */
export function subscribeToNip17Messages(
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

        const filter = {
            kinds: [1059],
            "#p": [myPubkey],
            since: now - 60,
        };

        const sub = pool.subscribeMany(DEFAULT_RELAYS, filter, {
            async onevent(event) {
                if (seen.has(event.id)) return;
                seen.add(event.id);

                try {
                    const message = await unwrapGiftWrap(event, myPubkey);
                    if (!message) return;

                    // Filter by moonshot
                    if (moonshotId && message.moonshotId && message.moonshotId !== moonshotId) return;

                    const conversationKey = getConversationKey(
                        myPubkey,
                        message.senderPubkey === myPubkey ? message.receiverPubkey : message.senderPubkey,
                        moonshotId
                    );
                    await saveMessageToDB(message, conversationKey);
                    onMessage(message);
                } catch (error) {
                    console.error("Failed to process:", error);
                }
            },
            oneose() { },
        });

        subs.push(sub);
    });

    return () => subs.forEach(sub => sub.close());
}