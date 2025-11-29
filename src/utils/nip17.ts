import { nip44, generateSecretKey, getPublicKey, finalizeEvent, verifyEvent } from 'nostr-tools';
import { DEFAULT_RELAYS } from './relayConfig';
import { getPool } from './nostr';

// Send NIP-17 encrypted DM (sealed direct message)
export async function sendEncryptedDM(
    recipientPubkey: string,
    message: string
): Promise<void> {
    if (!window.nostr) {
        throw new Error("Nostr extension not found");
    }

    try {
        // Get sender's keys
        const senderPubkey = await window.nostr.getPublicKey();

        // Create the unsigned kind 14 message
        const unsignedMessage: any = {
            kind: 14,
            created_at: Math.floor(Date.now() / 1000),
            tags: [["p", recipientPubkey]],
            content: message,
            pubkey: senderPubkey,
        };

        // Step 1: Create seal (kind 13) - encrypt the unsigned message with NIP-44
        const sealContent = await nip44.encrypt(message, senderPubkey, recipientPubkey);

        const seal: any = {
            kind: 13,
            created_at: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 172800), // Random up to 2 days in past
            tags: [],
            content: sealContent,
            pubkey: senderPubkey,
        };

        // Sign the seal (this is the only part that gets signed by the sender)
        const signedSeal = await window.nostr.signEvent(seal);

        // Step 2: Create gift wrap for recipient (kind 1059)
        const recipientRandomKey = generateSecretKey();
        const recipientRandomPubkey = getPublicKey(recipientRandomKey);

        const giftWrapForRecipient: any = {
            kind: 1059,
            created_at: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 172800), // Random up to 2 days in past
            tags: [["p", recipientPubkey]],
            content: await nip44.encrypt(
                JSON.stringify(signedSeal),
                recipientRandomKey,
                recipientPubkey
            ),
            pubkey: recipientRandomPubkey,
        };

        // Sign the gift wrap with the random key
        const signedGiftWrapRecipient = finalizeEvent(giftWrapForRecipient, recipientRandomKey);

        // Step 3: Create gift wrap for sender (kind 1059) - for their own records
        const senderRandomKey = generateSecretKey();
        const senderRandomPubkey = getPublicKey(senderRandomKey);

        const giftWrapForSender: any = {
            kind: 1059,
            created_at: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 172800), // Random up to 2 days in past
            tags: [["p", senderPubkey]],
            content: await nip44.encrypt(
                JSON.stringify(signedSeal),
                senderRandomKey,
                senderPubkey
            ),
            pubkey: senderRandomPubkey,
        };

        // Sign the gift wrap with the random key
        const signedGiftWrapSender = finalizeEvent(giftWrapForSender, senderRandomKey);

        // Publish both gift wraps
        const pool = getPool();
        const pubs1 = pool.publish(DEFAULT_RELAYS, signedGiftWrapRecipient);
        const pubs2 = pool.publish(DEFAULT_RELAYS, signedGiftWrapSender);

        await Promise.race([
            Promise.all([...pubs1, ...pubs2]),
            new Promise(resolve => setTimeout(resolve, 5000))
        ]);

    } catch (error) {
        console.error("Failed to send NIP-17 DM:", error);
        throw new Error(`Failed to send encrypted message: ${error.message}`);
    }
}

// Decrypt NIP-17 message
export async function decryptNIP17Message(
    giftWrapEvent: any, // The kind 1059 gift wrap event
    recipientPrivateKey: Uint8Array // Recipient's private key for decryption
): Promise<{ message: string; sender: string; timestamp: number }> {
    try {
        // Decrypt the gift wrap content to get the sealed event
        const sealedEventJson = await nip44.decrypt(
            giftWrapEvent.content,
            recipientPrivateKey,
            giftWrapEvent.pubkey
        );

        const sealedEvent = JSON.parse(sealedEventJson);

        // Verify the seal signature
        if (!verifyEvent(sealedEvent)) {
            throw new Error("Invalid seal signature");
        }

        // The seal content contains the encrypted original message
        // We need to decrypt it using NIP-44 with the sender's pubkey
        const decryptedContent = await nip44.decrypt(
            sealedEvent.content,
            recipientPrivateKey,
            sealedEvent.pubkey
        );

        return {
            message: decryptedContent,
            sender: sealedEvent.pubkey,
            timestamp: sealedEvent.created_at
        };

    } catch (error) {
        console.error("Failed to decrypt NIP-17 message:", error);
        throw new Error(`Decryption failed: ${error.message}`);
    }
}

// Check if user has DM relays configured (kind 10050)
export async function getUserDMRelays(pubkey: string): Promise<string[]> {
    const pool = getPool();
    const events = await pool.list(DEFAULT_RELAYS, [
        {
            kinds: [10050],
            authors: [pubkey],
        }
    ], { skipVerification: true });

    if (events.length === 0) {
        return [];
    }

    const relayTags = events[0].tags.filter(tag => tag[0] === 'relay');
    return relayTags.map(tag => tag[1]);
}

// Publish user's DM relay preferences (kind 10050)
export async function publishDMRelays(relays: string[]): Promise<void> {
    if (!window.nostr) {
        throw new Error("Nostr extension not found");
    }

    const event = {
        kind: 10050,
        created_at: Math.floor(Date.now() / 1000),
        tags: relays.map(relay => ['relay', relay]),
        content: '',
    };

    const signedEvent = await window.nostr.signEvent(event);
    const pool = getPool();
    const pubs = pool.publish(DEFAULT_RELAYS, signedEvent);
    await Promise.race([Promise.all(pubs), new Promise(resolve => setTimeout(resolve, 5000))]);
}