/* eslint-disable @typescript-eslint/no-explicit-any */
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
    isExplorable?: boolean;
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

type DayOfMonth = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25;
type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface Monthly {
    type: "monthly";
    duration: 3 | 6 | 9;
    releaseDay: DayOfMonth;
}

export interface Weekly {
    type: "weekly"
    duration: 4 | 8 | 12;
    releaseDay: Weekday;
}

// Angor Project Types
export type FundPattern = Monthly | Weekly;

export interface AngorProjectExport {
    moonshot: Moonshot;
    projectType: "fund";
    selectedBuilderPubkey: string; // Builder's pubkey
    penaltyThreshold: string; // 1M sats
    fundingPattern: FundPattern; // Array of stages with percentages
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

export interface ChatMessage {
    id: string;
    senderPubkey: string;
    receiverPubkey: string;
    content: string;
    timestamp: number;
    encrypted: boolean;
    moonshotId?: string;
    interestId?: string;
}

export interface Comment {
    id: string; // d-tag UUID
    eventId: string;
    moonshotId: string;
    authorPubkey: string;
    content: string;
    chipIn: number; // Sats willing to contribute (0 = none)
    parentCommentId?: string; // If reply, parent comment event ID
    createdAt: number;
    replies?: Comment[]; // For nested display
}

export type ExportedMoonshot = {
  exportEventId: string;
  moonshotEventId: string;
  exportedBy: string;
};

export type ExportedStatus = {
    isExported: boolean,
  exportEventId: string | null;
}
