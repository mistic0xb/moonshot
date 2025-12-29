import type { ChatMessage } from "../types/types";
import type { Event } from "nostr-tools";
import { getPool } from "./nostr/pool";
import { MSG_DEFAULT_RELAYS } from "./nostr/relayConfig";

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
    request.onupgradeneeded = event => {
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

async function loadMessagesFromDB(myPubkey: string, otherPubkey: string): Promise<ChatMessage[]> {
  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("conversationKey");
    const conversationKey = getConversationKey(myPubkey, otherPubkey);

    return new Promise((resolve, reject) => {
      const request = index.getAll(conversationKey);
      request.onsuccess = () => {
        const results = request.result || [];
        const messages = results
          .map((r: any) => {
            const { conversationKey: _, ...message } = r;
            return message as ChatMessage;
          })
          .sort((a, b) => a.timestamp - b.timestamp);
        resolve(messages);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("Failed to load from IndexedDB:", err);
    return [];
  }
}

function getConversationKey(pubkey1: string, pubkey2: string): string {
  const sorted = [pubkey1, pubkey2].sort();
  return `${sorted[0]}_${sorted[1]}`;
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
        ...(interestId ? [["interest", interestId]] : []),
      ],
      content: encryptedContent,
    };

    const signedEvent = await window.nostr.signEvent(unsignedEvent);
    const pool = getPool();
    const pubs = pool.publish(MSG_DEFAULT_RELAYS, signedEvent);

    await Promise.race([Promise.all(pubs), new Promise(resolve => setTimeout(resolve, 5000))]);

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

    const conversationKey = getConversationKey(myPubkey, recipientPubkey);
    await saveMessageToDB(message, conversationKey);

    return signedEvent.id;
  } catch (error) {
    console.error("Failed to send message:", error);
    throw error;
  }
}

export async function fetchNip04Messages(
  otherPubkey: string,
  limit: number = 100
): Promise<ChatMessage[]> {
  if (!window.nostr) {
    throw new Error("Nostr extension not found");
  }

  const myPubkey = await window.nostr.getPublicKey();
  const cachedMessages = await loadMessagesFromDB(myPubkey, otherPubkey);
  const pool = getPool();
  const messages: ChatMessage[] = [...cachedMessages];
  const seen = new Set<string>(cachedMessages.map(m => m.id));
  const conversationKey = getConversationKey(myPubkey, otherPubkey);

  return new Promise(resolve => {
    const filters = [
      { kinds: [4], "#p": [myPubkey], authors: [otherPubkey], limit },
      { kinds: [4], "#p": [otherPubkey], authors: [myPubkey], limit },
    ];

    let completedSubs = 0;
    const checkCompletion = () => {
      completedSubs++;
      if (completedSubs >= 2) {
        messages.sort((a, b) => a.timestamp - b.timestamp);
        resolve(messages);
      }
    };

    filters.forEach(filter => {
      const sub = pool.subscribeMany(MSG_DEFAULT_RELAYS, filter, {
        async onevent(event) {
          if (seen.has(event.id)) return;
          seen.add(event.id);

          try {
            const receiverPubkey = event.tags.find(t => t[0] === "p")?.[1];
            if (!receiverPubkey) return;

            const moonshotTag = event.tags.find(t => t[0] === "moonshot");
            const interestTag = event.tags.find(t => t[0] === "interest");

            const isRelevant =
              (event.pubkey === myPubkey && receiverPubkey === otherPubkey) ||
              (event.pubkey === otherPubkey && receiverPubkey === myPubkey);

            if (!isRelevant) return;

            const nip04 = getNip04();
            const decryptedContent =
              event.pubkey === myPubkey
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
  otherPubkey: string
): () => void {
  if (!window.nostr) {
    throw new Error("Nostr extension not found");
  }

  const pool = getPool();
  const seen = new Set<string>();
  const subs: any[] = [];

  window.nostr.getPublicKey().then(async myPubkey => {
    const now = Math.floor(Date.now() / 1000);

    // Subscribe to incoming messages from the specific person
    const incomingFilter = {
      kinds: [4],
      authors: [otherPubkey],
      "#p": [myPubkey],
      since: now,
    };

    // Subscribe to outgoing messages to the specific person
    const outgoingFilter = {
      kinds: [4],
      authors: [myPubkey],
      "#p": [otherPubkey],
      since: now,
    };

    const processEvent = async (event: Event, isIncoming: boolean) => {
      if (seen.has(event.id)) {
        console.log("[NIP-04] Duplicate, skipping");
        return;
      }
      seen.add(event.id);

      try {
        const receiverPubkey = event.tags.find((t: any) => t[0] === "p")?.[1];
        if (!receiverPubkey) {
          console.log("[NIP-04] No receiver in tags");
          return;
        }

        console.log("[NIP-04] To:", receiverPubkey.slice(0, 8));

        // Simple check: is this between me and the other person?
        const isPartOfConversation =
          (event.pubkey === myPubkey && receiverPubkey === otherPubkey) ||
          (event.pubkey === otherPubkey && receiverPubkey === myPubkey);

        if (!isPartOfConversation) {
          console.log("[NIP-04] Not part of this conversation");
          return;
        }

        const nip04 = getNip04();
        const decryptedContent = isIncoming
          ? await nip04.decrypt(event.pubkey, event.content)
          : await nip04.decrypt(receiverPubkey, event.content);

        const moonshotTag = event.tags.find(t => t[0] === "moonshot");
        const interestTag = event.tags.find(t => t[0] === "interest");

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

        // Save to IndexedDB
        const conversationKey = getConversationKey(myPubkey, otherPubkey);
        await saveMessageToDB(message, conversationKey);

        // Notify the UI
        onMessage(message);
      } catch (error) {
        console.error(`[NIP-04] Processing failed:`, error);
      }
    };

    // Subscribe to incoming messages
    const incomingSub = pool.subscribeMany(MSG_DEFAULT_RELAYS, incomingFilter, {
      onevent: (event: Event) => processEvent(event, true),
      oneose: () => console.log("[NIP-04] ✅ Incoming subscription ready"),
    });

    // Subscribe to outgoing messages
    const outgoingSub = pool.subscribeMany(MSG_DEFAULT_RELAYS, outgoingFilter, {
      onevent: (event: Event) => processEvent(event, false),
      oneose: () => console.log("[NIP-04] ✅ Outgoing subscription ready"),
    });

    subs.push(incomingSub, outgoingSub);
  });

  return () => {
    console.log("[NIP-04] Unsubscribing");
    subs.forEach(sub => sub.close());
  };
}
