
import type { Event } from "nostr-tools";
import type { Moonshot } from "../../types/types";
import { getPool } from "./pool";
import { DEFAULT_RELAYS } from "./relayConfig";
// Fetch all moonshot events
export async function fetchAllMoonshots(): Promise<Moonshot[]> {
    const pool = getPool();

    return new Promise(resolve => {
        const moonshots: Moonshot[] = [];
        const seen = new Set<string>();
        let sub: any;

        const timeout = setTimeout(() => {
            if (sub) sub.close();
            console.log("Fetched moonshots:", moonshots.length);
            resolve(moonshots);
        }, 5000);

        const filter = {
            kinds: [30078],
            "#t": ["moonshot"],
            limit: 500,
        };

        sub = pool.subscribeMany(DEFAULT_RELAYS, filter, {
            onevent(event: Event) {
                if (seen.has(event.id)) return;
                seen.add(event.id);

                try {
                    const dTag = event.tags.find(t => t[0] === "d");
                    const titleTag = event.tags.find(t => t[0] === "title");
                    const budgetTag = event.tags.find(t => t[0] === "budget");
                    const timelineTag = event.tags.find(t => t[0] === "timeline");
                    const statusTag = event.tags.find(t => t[0] === "status");
                    const topicsTag = event.tags.find(t => t[0] === "topics");
                    const isExplorableTag = event.tags.find(t => t[0] === "isExplorable");

                    if (!dTag || !titleTag) {
                        console.warn("Invalid moonshot event (missing d or title):", event);
                        return;
                    }

                    const moonshot: Moonshot = {
                        id: dTag[1],
                        eventId: event.id,
                        title: titleTag[1],
                        content: event.content,
                        budget: budgetTag?.[1] || "TBD",
                        timeline: timelineTag?.[1] || "TBD",
                        topics: topicsTag ? topicsTag.slice(1) : [], // Get all topics after tag name
                        status: (statusTag?.[1] as any) || "open",
                        creatorPubkey: event.pubkey,
                        isExplorable: isExplorableTag?.[1] === "false" ? false : true,
                        createdAt: event.created_at * 1000,
                    };

                    moonshots.push(moonshot);
                } catch (err) {
                    console.error("Failed to parse moonshot event:", err);
                }
            },
            oneose() {
                clearTimeout(timeout);
                if (sub) sub.close();
                console.log("Subscription closed, total moonshots:", moonshots.length);
                resolve(moonshots);
            },
        });
    });
}

// Fetch single moonshot by ID
export async function fetchMoonshotById(moonshotId: string,): Promise<Moonshot | null> {
    const pool = getPool();

    return new Promise(resolve => {
        let sub: any;

        const timeout = setTimeout(() => {
            if (sub) sub.close();
            console.log("Moonshot not found:", moonshotId);
            resolve(null);
        }, 5000);

        const filter = {
            kinds: [30078],
            "#d": [moonshotId],
            "#t": ["moonshot"],
        };

        sub = pool.subscribeMany(DEFAULT_RELAYS, filter, {
            onevent(event: Event) {
                clearTimeout(timeout);
                if (sub) sub.close();

                try {
                    const dTag = event.tags.find(t => t[0] === "d");
                    const titleTag = event.tags.find(t => t[0] === "title");
                    const budgetTag = event.tags.find(t => t[0] === "budget");
                    const timelineTag = event.tags.find(t => t[0] === "timeline");
                    const statusTag = event.tags.find(t => t[0] === "status");
                    const topicsTag = event.tags.find(t => t[0] === "topics");
                    const isExplorableTag = event.tags.find(t => t[0] === "isExplorable");


                    if (!dTag || !titleTag) {
                        resolve(null);
                        return;
                    }

                    const moonshot: Moonshot = {
                        id: dTag[1],
                        eventId: event.id,
                        title: titleTag[1],
                        content: event.content,
                        budget: budgetTag?.[1] || "TBD",
                        timeline: timelineTag?.[1] || "TBD",
                        topics: topicsTag ? topicsTag.slice(1) : [],
                        status: (statusTag?.[1] as any) || "open",
                        creatorPubkey: event.pubkey,
                        isExplorable: isExplorableTag?.[1] === "false" ? false : true,
                        createdAt: event.created_at * 1000,
                    };

                    console.log("Moonshot found:", moonshot);
                    resolve(moonshot);
                } catch (err) {
                    console.error("Failed to parse moonshot:", err);
                    resolve(null);
                }
            },
            oneose() {
                clearTimeout(timeout);
                if (sub) sub.close();
                resolve(null);
            },
        });
    });
}

// Fetch version history for a moonshot
export async function fetchMoonshotVersions(moonshotId: string, creatorPubkey: string): Promise<Moonshot[]> {
    const pool = getPool();
    return new Promise(resolve => {
        const versions: Moonshot[] = [];
        let sub: any;

        const timeout = setTimeout(() => {
            if (sub) sub.close();
            console.log("Version fetch timeout");
            resolve(versions);
        }, 5000);

        const filter = {
            kinds: [30078],
            "#a": [`30078:${creatorPubkey}:${moonshotId}`]
        };

        sub = pool.subscribeMany(DEFAULT_RELAYS, filter, {
            onevent(event: any) {
                try {
                    const dTag = event.tags.find((t: string[]) => t[0] === "d");
                    const aTag = event.tags.find((t: string[]) => t[0] === "a");
                    const eventRefTag = event.tags.find((t: string[]) => t[0] === "e");
                    const titleTag = event.tags.find((t: string[]) => t[0] === "title");
                    const budgetTag = event.tags.find((t: string[]) => t[0] === "budget");
                    const timelineTag = event.tags.find((t: string[]) => t[0] === "timeline");
                    const statusTag = event.tags.find((t: string[]) => t[0] === "status");
                    const topicsTag = event.tags.find((t: string[]) => t[0] === "topics");
                    const originalTimestampTag = event.tags.find((t: string[]) => t[0] === "original-timestamp");

                    if (!dTag || !aTag || !titleTag) {
                        return;
                    }

                    const version: Moonshot = {
                        id: dTag[1],
                        eventId: eventRefTag?.[1] || event.id,
                        title: titleTag[1],
                        content: event.content,
                        budget: budgetTag?.[1] || "TBD",
                        timeline: timelineTag?.[1] || "TBD",
                        topics: topicsTag ? topicsTag.slice(1) : [],
                        status: (statusTag?.[1] as any) || "open",
                        creatorPubkey: event.pubkey,
                        isExplorable: false, // Versions are not explorable
                        createdAt: originalTimestampTag
                            ? parseInt(originalTimestampTag[1])
                            : event.created_at * 1000,
                    };

                    versions.push(version);
                } catch (err) {
                    console.error("Failed to parse version:", err);
                }
            },
            oneose() {
                clearTimeout(timeout);
                if (sub) sub.close();

                // Sort versions by creation time (newest first)
                versions.sort((a, b) => b.createdAt - a.createdAt);

                console.log(`Found ${versions.length} versions for moonshot ${moonshotId}`);
                resolve(versions);
            },
        });
    });
}

// Get count of versions (for badges)
export async function getVersionCount(moonshotId: string, creatorPubkey: string): Promise<number> {
    const versions = await fetchMoonshotVersions(moonshotId, creatorPubkey);
    return versions.length;
}