export interface Moonshot {
    id: string;
    title: string;
    content: string; // Markdown
    budget: string;
    timeline: string;
    topics: Array<string>,
    status: string,
    creatorPubkey: string;
    upvotes: number;
    interests: number;
    createdAt: number;
}

export interface Interest {
    id: string;
    moonshotId: string;
    builderPubkey: string;
    message?: string;
    github?: string;
    createdAt: number;
}

export interface Builder {
    npub: string;
    message?: string;
    github?: string;
    timestamp: number;
}

export interface WindowNostr {
    getPublicKey(): Promise<string>;
    signEvent(event: any): Promise<any>;
    nip04?: {
        encrypt(recipientPubkey: string, message: string): Promise<string>;
        decrypt(senderPubkey: string, encryptedContent: string): Promise<string>;
    };
    nip44?: {
        encrypt(plaintext: string, senderPrivateKey: Uint8Array, recipientPublicKey: string): Promise<string>;
        decrypt(ciphertext: string, recipientPrivateKey: Uint8Array, senderPublicKey: string): Promise<string>;
    };
}

declare global {
    interface Window {
        nostr?: WindowNostr;
        nostrLogin?: {
            init: (opts: any) => void;
            launch: (modal: string) => void;
        };
    }
}

// NIP-17 specific types
export interface SealedEvent extends Event {
    kind: 13;
    content: string; // NIP-44 encrypted content
}

export interface GiftWrapEvent extends Event {
    kind: 1059;
    tags: [["p", string]];
    content: string; // NIP-44 encrypted sealed event
}

export interface DMRelayEvent extends Event {
    kind: 10050;
    tags: string[][]; // [["relay", "wss://..."], ...]
    content: "";
}

export interface DecryptedMessage {
    message: string;
    sender: string;
    timestamp: number;
    decryptedAt: number;
}

// Response types
export interface NostrResponse {
    success: boolean;
    eventId?: string;
    error?: string;
}