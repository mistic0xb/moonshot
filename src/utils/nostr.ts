import { SimplePool, finalizeEvent, type Event } from "nostr-tools";
import type { Moonshot, Interest, ProofOfWorkLink } from "../types/types";
import { DEFAULT_RELAYS } from "./relayConfig";
import { v4 as uuidv4 } from 'uuid';


let poolInstance: SimplePool | null = null;

export function getPool(): SimplePool {
    if (!poolInstance) {
        poolInstance = new SimplePool();
    }
    return poolInstance;
}

// Publish moonshot event (kind 30078)
export async function publishMoonshot(
    title: string,
    content: string,
    budget: string,
    timeline: string,
    topics: string[]
): Promise<string> {
    if (!window.nostr) {
        throw new Error("Nostr extension not found");
    }

    const pool = getPool();
    const moonshotId = uuidv4();

    // Build tags array
    const eventTags = [
        ["d", moonshotId],
        ["t", "moonshot"], // Required for discovery
        ["title", title],
        ["topics", ...topics], // Store all topics in one tag
        ["budget", budget],
        ["timeline", timeline],
        ["status", "open"]
    ];

    const event = {
        kind: 30078,
        created_at: Math.floor(Date.now() / 1000),
        tags: eventTags,
        content: content,
    };

    console.log("Publishing moonshot event:", event);

    const signedEvent = await window.nostr.signEvent(event);
    const pubs = pool.publish(DEFAULT_RELAYS, signedEvent);

    await Promise.race([
        Promise.all(pubs),
        new Promise(resolve => setTimeout(resolve, 5000))
    ]);

    console.log("Moonshot published with ID:", moonshotId);
    return moonshotId;
}

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

// Publish interest event (kind 30078)
export async function publishInterest(
    moonshotId: string, // d-tag of moonshot
    moonshotEventId: string, // event ID of moonshot
    creatorPubkey: string,
    message: string,
    github?: string,
    proofOfWorkLinks?: ProofOfWorkLink[]
): Promise<string> {
    if (!window.nostr) {
        throw new Error("Nostr extension not found");
    }

    const interestId = uuidv4();

    const tags = [
        ["d", interestId],
        ["t", "moonshot-interest"],
        ["moonshot", moonshotId], // Reference to moonshot d-tag
        ["e", moonshotEventId], // Reference to moonshot event ID
        ["p", creatorPubkey],
    ];

    if (github) {
        tags.push(["github", github]);
    }

    // Add proof of work links (max 10)
    if (proofOfWorkLinks && proofOfWorkLinks.length > 0) {
        proofOfWorkLinks.slice(0, 10).forEach(link => {
            tags.push(["proof", link.url, link.description || ""]);
        });
    }

    const event = {
        kind: 30078,
        created_at: Math.floor(Date.now() / 1000),
        tags,
        content: message,
    };

    console.log("Publishing interest:", event);

    const signedEvent = await window.nostr.signEvent(event);
    const pool = getPool();
    const pubs = pool.publish(DEFAULT_RELAYS, signedEvent);

    await Promise.race([
        Promise.all(pubs),
        new Promise(resolve => setTimeout(resolve, 5000))
    ]);

    console.log("Interest published successfully with ID:", interestId);
    return interestId;
}

// Fetch interests for a moonshot (kind 30078)
export async function fetchInterests(moonshotEventId: string): Promise<Interest[]> {
    const pool = getPool();

    return new Promise(resolve => {
        const interests: Interest[] = [];
        const seen = new Set<string>();
        let sub: any;

        const timeout = setTimeout(() => {
            if (sub) sub.close();
            console.log("Fetched interests for moonshot:", moonshotEventId, "Count:", interests.length);
            resolve(interests);
        }, 5000);

        // const filter = {
        //     kinds: [30078],
        //     "#t": ["moonshot-interest"],
        //     limit: 100,
        // };

        const filter = {
            kinds: [30078],
            "#e": [moonshotEventId], // If you have the event ID
            limit: 100,
        };

        console.log("Fetching interests with filter:", filter);

        sub = pool.subscribeMany(DEFAULT_RELAYS, filter, { // FIXED: wrap filter in array
            onevent(event: Event) {
                if (seen.has(event.id)) return;
                seen.add(event.id);

                console.log("Interest event received:", event);

                try {
                    const dTag = event.tags.find(t => t[0] === "d");
                    const moonshotTag = event.tags.find(t => t[0] === "moonshot");
                    const moonshotEventTag = event.tags.find(t => t[0] === "e");
                    const githubTag = event.tags.find(t => t[0] === "github");
                    const proofTags = event.tags.filter(t => t[0] === "proof");

                    if (!dTag || !moonshotTag) {
                        console.warn("Interest event missing required tags:", event);
                        return;
                    }

                    const interest: Interest = {
                        id: dTag[1],
                        eventId: event.id,
                        moonshotId: moonshotTag[1],
                        moonshotEventId: moonshotEventTag?.[1] || "",
                        builderPubkey: event.pubkey,
                        message: event.content,
                        github: githubTag?.[1],
                        proofOfWorkLinks: proofTags.map(tag => ({
                            url: tag[1],
                            description: tag[2] || ""
                        })),
                        createdAt: event.created_at * 1000,
                    };

                    console.log("Interest parsed:", interest);
                    interests.push(interest);
                } catch (err) {
                    console.error("Failed to parse interest:", err);
                }
            },
            oneose() {
                clearTimeout(timeout);
                if (sub) sub.close();
                console.log("Interest subscription closed. Total:", interests.length);
                resolve(interests);
            },
        });
    });
}

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