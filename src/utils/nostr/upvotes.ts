import type { Event } from "nostr-tools";
import { getPool } from "./pool";
import { DEFAULT_RELAYS } from "./relayConfig";

// Check if current user has upvoted
export async function checkUserUpvote(
    moonshotId: string,
    creatorPubkey: string,
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
            "#a": [`30078:${creatorPubkey}:${moonshotId}`],
            authors: [userPubkey],  // Filter by user
            limit: 10
        };

        sub = pool.subscribeMany(DEFAULT_RELAYS, filter, {
            onevent(event: Event) {
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
    moonshotId: string,
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
            ["a", `30078:${creatorPubkey}:${moonshotId}`],
            ["p", creatorPubkey],
        ],
        content: currentlyUpvoted ? "-" : "+",
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
    moonshotId: string,
    creatorPubkey: string
): Promise<number> {
    const pool = getPool();
    return new Promise(resolve => {
        const latestReactions = new Map<string, string>();
        let sub: any;

        const timeout = setTimeout(() => {
            if (sub) sub.close();
            const count = Array.from(latestReactions.values())
                .filter(reaction => reaction === "+").length;
            resolve(count);
        }, 3000);

        const filter = {
            kinds: [7],
            "#a": [`30078:${creatorPubkey}:${moonshotId}`],
            limit: 500,
        };

        sub = pool.subscribeMany(DEFAULT_RELAYS, filter, {
            onevent(event: Event) {
                const existing = latestReactions.get(event.pubkey);
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