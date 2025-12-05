import type { Event } from "nostr-tools";
import type { Interest } from "../../types/types";
import { getPool } from "./pool";
import { DEFAULT_RELAYS } from "./relayConfig";

// Fetch interests for a moonshot (kind 30078)
export async function fetchInterests(creatorPubkey: string, moonshotId: string): Promise<Interest[]> {
    const pool = getPool();

    return new Promise(resolve => {
        const interests: Interest[] = [];
        const seen = new Set<string>();
        let sub: any;

        const timeout = setTimeout(() => {
            if (sub) sub.close();
            console.log("Fetched interests for moonshot:", moonshotId, "Count:", interests.length);
            resolve(interests);
        }, 5000);

        const filter = {
            kinds: [30078],
            "#a": [`30078:${creatorPubkey}:${moonshotId}`],
            "#t": ["moonshot-interest"],
            limit: 100,
        };

        console.log("Fetching interests with filter:", filter);

        sub = pool.subscribeMany(DEFAULT_RELAYS, filter, {
            onevent(event: Event) {
                if (seen.has(event.id)) return;
                seen.add(event.id);

                console.log("Interest event received:", event);

                try {
                    const dTag = event.tags.find(t => t[0] === "d");
                    const aTag = event.tags.find(t => t[0] === "a");
                    const moonshotEventTag = event.tags.find(t => t[0] === "e");
                    const githubTag = event.tags.find(t => t[0] === "github");
                    const proofTags = event.tags.filter(t => t[0] === "proof");

                    if (!dTag || !aTag) {
                        console.warn("Interest event missing required tags:", event);
                        return;
                    }

                    const interest: Interest = {
                        id: dTag[1],
                        eventId: event.id,
                        moonshotId: aTag[1].split(":")[1],
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

// function to fetch all interests by a user
export async function fetchUserInterests(userPubkey: string): Promise<Interest[]> {
    const pool = getPool();

    return new Promise(resolve => {
        const interests: Interest[] = [];
        const seen = new Set<string>();
        let sub: any;

        const timeout = setTimeout(() => {
            if (sub) sub.close();
            resolve(interests);
        }, 5000);

        const filter = {
            kinds: [30078],
            "#t": ["moonshot-interest"],
            authors: [userPubkey],
            limit: 100,
        };

        sub = pool.subscribeMany(DEFAULT_RELAYS, filter, {
            onevent(event: any) {
                if (seen.has(event.id)) return;
                seen.add(event.id);

                try {
                    const dTag = event.tags.find((t: string[]) => t[0] === "d");
                    const moonshotTag = event.tags.find((t: string[]) => t[0] === "moonshot");
                    const moonshotEventTag = event.tags.find((t: string[]) => t[0] === "e");
                    const githubTag = event.tags.find((t: string[]) => t[0] === "github");
                    const proofTags = event.tags.filter((t: string[]) => t[0] === "proof");
                    const creatorPubkeyTag = event.tags.find((t: string[]) => t[0] === "p");

                    if (!dTag || !moonshotTag) return;

                    const interest: Interest = {
                        id: dTag[1],
                        eventId: event.id,
                        moonshotId: moonshotTag[1],
                        moonshotEventId: moonshotEventTag?.[1] || "",
                        moonshotCreatorPubkey: creatorPubkeyTag?.[1],
                        builderPubkey: event.pubkey,
                        message: event.content,
                        github: githubTag?.[1],
                        proofOfWorkLinks: proofTags.map((tag: string[]) => ({
                            url: tag[1],
                            description: tag[2] || "",
                        })),
                        createdAt: event.created_at * 1000,
                    };

                    interests.push(interest);
                } catch (err) {
                    console.error("Failed to parse interest:", err);
                }
            },
            oneose() {
                clearTimeout(timeout);
                if (sub) sub.close();
                resolve(interests);
            },
        });
    });
}


// Fetch user profile (kind 0)
export async function fetchUserProfile(pubkey: string): Promise<{
    pubkey: string;
    name?: string;
    picture?: string;
    about?: string;
} | null> {
    const pool = getPool();

    return new Promise(resolve => {
        let sub: any;

        const timeout = setTimeout(() => {
            if (sub) sub.close();
            resolve(null);
        }, 3000);

        const filter = {
            kinds: [0],
            authors: [pubkey],
            limit: 1,
        };

        sub = pool.subscribeMany(DEFAULT_RELAYS, filter, {
            onevent(event: Event) {
                clearTimeout(timeout);
                if (sub) sub.close();

                try {
                    const profileData = JSON.parse(event.content);
                    resolve({
                        pubkey,
                        name: profileData.name,
                        picture: profileData.picture,
                        about: profileData.about,
                    });
                } catch (err) {
                    console.error("Failed to parse user profile:", err);
                    resolve({ pubkey });
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