export interface Moonshot {
    id: string;
    eventId: string;
    title: string;
    content: string; // Markdown
    budget: string;
    timeline: string;
    topics: Array<string>,
    status: string,
    creatorPubkey: string;
    createdAt: number;
}

export interface ProofOfWorkLink {
    url: string;
    description: string;
}

export interface Interest {
    id: string; // d-tag UUID
    eventId: string; // Actual nostr event ID
    moonshotId: string; // The moonshot's d-tag
    moonshotEventId: string; // The moonshot's event ID
    builderPubkey: string;
    moonshotCreatorPubkey?: string;
    message: string;
    github?: string;
    proofOfWorkLinks: ProofOfWorkLink[]; // Up to 10 links
    createdAt: number;
}

export interface WindowNostr {
    getPublicKey(): Promise<string>;
    signEvent(event: any): Promise<any>;
    nip04?: {
        encrypt(pubkey: string, plaintext: string): Promise<string>;
        decrypt(pubkey: string, ciphertext: string): Promise<string>;
    };
    nip44?: {
        encrypt(pubkey: string, plaintext: string): Promise<string>;
        decrypt(pubkey: string, ciphertext: string): Promise<string>;
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

export interface UserProfile {
    pubkey: string;
    name?: string;
    picture?: string;
    about?: string;
}