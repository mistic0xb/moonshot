import { SimplePool, finalizeEvent, type Event } from "nostr-tools";
import type { Moonshot, Interest } from "../types/types";
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
                        title: titleTag[1],
                        content: event.content,
                        budget: budgetTag?.[1] || "TBD",
                        timeline: timelineTag?.[1] || "TBD",
                        topics: topicsTag ? topicsTag.slice(1) : [], // Get all topics after tag name
                        status: (statusTag?.[1] as any) || "open",
                        creatorPubkey: event.pubkey,
                        createdAt: event.created_at * 1000,
                        upvotes: 0, // Will be calculated separately
                        interests: 0, // Will be calculated separately
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
                        title: titleTag[1],
                        content: event.content,
                        budget: budgetTag?.[1] || "TBD",
                        timeline: timelineTag?.[1] || "TBD",
                        topics: topicsTag ? topicsTag.slice(1) : [],
                        status: (statusTag?.[1] as any) || "open",
                        creatorPubkey: event.pubkey,
                        createdAt: event.created_at * 1000,
                        upvotes: 0,
                        interests: 0,
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

// // Publish interest event (kind 1 - short note)
// export async function publishInterest(
//     moonshotEventId: string,
//     creatorPubkey: string,
//     message: string,
//     github?: string,
//     portfolio?: string,
//     additionalLinks?: { url: string; description: string }[]
// ): Promise<void> {
//     if (!window.nostr) {
//         throw new Error("Nostr extension not found");
//     }

//     const tags = [
//         ["e", moonshotEventId, "", "root"],
//         ["p", creatorPubkey],
//         ["t", "moonshot-interest"],
//     ];

//     if (github) {
//         tags.push(["github", github]);
//     }

//     if (portfolio) {
//         tags.push(["portfolio", portfolio]);
//     }

//     if (additionalLinks) {
//         additionalLinks.forEach(link => {
//             tags.push(["link", link.url, link.description]);
//         });
//     }

//     const event = {
//         kind: 1,
//         created_at: Math.floor(Date.now() / 1000),
//         tags,
//         content: message,
//     };

//     console.log("Publishing interest:", event);

//     const signedEvent = await window.nostr.signEvent(event);
//     const pool = getPool();
//     const pubs = pool.publish(DEFAULT_RELAYS, signedEvent);

//     await Promise.race([
//         Promise.all(pubs),
//         new Promise(resolve => setTimeout(resolve, 5000))
//     ]);

//     console.log("Interest published successfully");
// }

// // Fetch interests for a moonshot (kind 1 replies)
// export async function fetchInterests(
//     moonshotEventId: string,
//     relays: string[] = DEFAULT_RELAYS
// ): Promise<Interest[]> {
//     const pool = getPool();

//     return new Promise(resolve => {
//         const interests: Interest[] = [];
//         const seen = new Set<string>();
//         let sub: any;

//         const timeout = setTimeout(() => {
//             if (sub) sub.close();
//             console.log("Fetched interests:", interests.length);
//             resolve(interests);
//         }, 5000);

//         const filter = {
//             kinds: [1],
//             "#e": [moonshotEventId],
//             "#t": ["moonshot-interest"],
//             limit: 100,
//         };

//         sub = pool.subscribeMany(relays, filter, {
//             onevent(event: Event) {
//                 if (seen.has(event.id)) return;
//                 seen.add(event.id);

//                 try {
//                     const githubTag = event.tags.find(t => t[0] === "github");
//                     const portfolioTag = event.tags.find(t => t[0] === "portfolio");
//                     const linkTags = event.tags.filter(t => t[0] === "link");

//                     const interest: Interest = {
//                         id: event.id,
//                         moonshotId: moonshotEventId,
//                         builderPubkey: event.pubkey,
//                         message: event.content,
//                         github: githubTag?.[1],
//                         portfolio: portfolioTag?.[1],
//                         additionalLinks: linkTags.map(tag => ({
//                             url: tag[1],
//                             description: tag[2] || ""
//                         })),
//                         createdAt: event.created_at * 1000,
//                     };

//                     interests.push(interest);
//                 } catch (err) {
//                     console.error("Failed to parse interest:", err);
//                 }
//             },
//             oneose() {
//                 clearTimeout(timeout);
//                 if (sub) sub.close();
//                 resolve(interests);
//             },
//         });
//     });
// }

// // Publish upvote (kind 7 reaction)
// export async function publishUpvote(
//     moonshotEventId: string,
//     creatorPubkey: string
// ): Promise<void> {
//     if (!window.nostr) {
//         throw new Error("Nostr extension not found");
//     }

//     const event = {
//         kind: 7,
//         created_at: Math.floor(Date.now() / 1000),
//         tags: [
//             ["e", moonshotEventId],
//             ["p", creatorPubkey],
//         ],
//         content: "+",
//     };

//     const signedEvent = await window.nostr.signEvent(event);
//     const pool = getPool();
//     const pubs = pool.publish(DEFAULT_RELAYS, signedEvent);

//     await Promise.race([
//         Promise.all(pubs),
//         new Promise(resolve => setTimeout(resolve, 5000))
//     ]);

//     console.log("Upvote published");
// }

// // Fetch upvote count for a moonshot
// export async function fetchUpvoteCount(moonshotEventId: string): Promise<number> {
//     const pool = getPool();

//     return new Promise(resolve => {
//         const upvoters = new Set<string>();
//         let sub: any;

//         const timeout = setTimeout(() => {
//             if (sub) sub.close();
//             console.log("Upvote count:", upvoters.size);
//             resolve(upvoters.size);
//         }, 5000);

//         const filter = {
//             kinds: [7],
//             "#e": [moonshotEventId],
//             limit: 500,
//         };

//         sub = pool.subscribeMany(DEFAULT_RELAYS, filter, {
//             onevent(event: Event) {
//                 if (event.content === "+") {
//                     upvoters.add(event.pubkey);
//                 }
//             },
//             oneose() {
//                 clearTimeout(timeout);
//                 if (sub) sub.close();
//                 resolve(upvoters.size);
//             },
//         });
//     });
// }

// // Update moonshot status (publish updated event with same d tag)
// export async function updateMoonshotStatus(
//     moonshotId: string,
//     newStatus: "open" | "in-progress" | "completed",
//     acceptedBuilderNpub?: string
// ): Promise<void> {
//     if (!window.nostr) {
//         throw new Error("Nostr extension not found");
//     }

//     // First fetch the existing moonshot to get all data
//     const existingMoonshot = await fetchMoonshotById(moonshotId);

//     if (!existingMoonshot) {
//         throw new Error("Moonshot not found");
//     }

//     const pool = getPool();

//     // Build updated tags
//     const eventTags = [
//         ["d", moonshotId],
//         ["t", "moonshot"],
//         ["title", existingMoonshot.title],
//         ["topics", ...existingMoonshot.topics],
//         ["budget", existingMoonshot.budget],
//         ["timeline", existingMoonshot.timeline],
//         ["status", newStatus]
//     ];

//     if (acceptedBuilderNpub && newStatus === "in-progress") {
//         eventTags.push(["accepted-builder", acceptedBuilderNpub]);
//     }

//     const event = {
//         kind: 30023,
//         created_at: Math.floor(Date.now() / 1000),
//         tags: eventTags,
//         content: existingMoonshot.content,
//     };

//     console.log("Updating moonshot status:", event);

//     const signedEvent = await window.nostr.signEvent(event);
//     const pubs = pool.publish(DEFAULT_RELAYS, signedEvent);

//     await Promise.race([
//         Promise.all(pubs),
//         new Promise(resolve => setTimeout(resolve, 5000))
//     ]);

//     console.log("Moonshot status updated to:", newStatus);
// }