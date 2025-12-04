import type { Event } from "nostr-tools";
import { getPool } from "./pool";
import { DEFAULT_RELAYS } from "./relayConfig";

// Check if current user has upvoted
export async function checkUserUpvote(
    moonshotEventId: string,
    userPubkey: string
): Promise<boolean> {
    const pool = getPool();

    return new Promise(resolve => {
        let hasUpvoted = false;
        let sub: any;

        const timeout = setTimeout(() => {
            if (sub) sub.close();
            resolve(hasUpvoted);
        }, 3000);

        const filter = {
            kinds: [7],
            "#e": [moonshotEventId],
            authors: [userPubkey],
            limit: 10
        };

        sub = pool.subscribeMany(DEFAULT_RELAYS, filter, {
            onevent(event: Event) {
                // Get the latest reaction from this user
                if (event.content === "+") {
                    hasUpvoted = true;
                } else if (event.content === "-") {
                    hasUpvoted = false;
                }
            },
            oneose() {
                clearTimeout(timeout);
                if (sub) sub.close();
                resolve(hasUpvoted);
            },
        });
    });
}

// Toggle upvote (upvote or un-upvote)
export async function toggleUpvote(
    moonshotEventId: string,
    creatorPubkey: string,
    currentlyUpvoted: boolean
): Promise<void> {
    if (!window.nostr) {
        throw new Error("Nostr extension not found");
    }

    const event = {
        kind: 7,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
            ["e", moonshotEventId],
            ["p", creatorPubkey],
        ],
        content: currentlyUpvoted ? "-" : "+", // Toggle
    };

    const signedEvent = await window.nostr.signEvent(event);
    const pool = getPool();
    const pubs = pool.publish(DEFAULT_RELAYS, signedEvent);

    await Promise.race([
        Promise.all(pubs),
        new Promise(resolve => setTimeout(resolve, 5000))
    ]);

    console.log(currentlyUpvoted ? "Upvote removed" : "Upvoted");
}

// Fetch upvote count (count unique users with latest "+" reaction)
export async function fetchUpvoteCount(
    moonshotEventId: string
): Promise<number> {
    const pool = getPool();

    return new Promise(resolve => {
        const latestReactions = new Map<string, string>(); // pubkey -> reaction
        let sub: any;

        const timeout = setTimeout(() => {
            if (sub) sub.close();
            // Count users whose latest reaction is "+"
            const count = Array.from(latestReactions.values())
                .filter(reaction => reaction === "+").length;
            resolve(count);
        }, 3000);

        const filter = {
            kinds: [7],
            "#e": [moonshotEventId],
            limit: 500,
        };

        sub = pool.subscribeMany(DEFAULT_RELAYS, filter, {
            onevent(event: Event) {
                const existing = latestReactions.get(event.pubkey);
                // Keep only the latest reaction per user
                if (!existing || event.created_at > (existing as any).created_at) {
                    latestReactions.set(event.pubkey, event.content);
                }
            },
            oneose() {
                clearTimeout(timeout);
                if (sub) sub.close();
                const count = Array.from(latestReactions.values())
                    .filter(reaction => reaction === "+").length;
                resolve(count);
            },
        });
    });
}