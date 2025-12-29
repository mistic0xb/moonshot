import type { Filter, Event } from "nostr-tools";
import { getPool } from "./pool";

const TRUST_RELAY = "wss://nip85.brainstorm.world";

export interface TrustMetrics {
    rank?: number;
    followers?: number;
    postCount?: number;
    zapAmtRecd?: number;
    zapAmtSent?: number;
    firstCreatedAt?: number;
    replyCount?: number;
    reactionsCount?: number;
    zapCntRecd?: number;
    zapCntSent?: number;
    hops?: number;
    personalizedGrapeRank_influence?: number;
    personalizedGrapeRank_average?: number;
    personalizedGrapeRank_confidence?: number;
    personalizedGrapeRank_input?: number;
    personalizedPageRank?: number;
    verifiedFollowerCount?: number;
    verifiedMuterCount?: number;
    verifiedReporterCount?: number;
}

/**
 * Parse NIP-85 event tags into metrics object
 */
function parseMetrics(event: Event): TrustMetrics {
    const metrics: TrustMetrics = {};

    for (const tag of event.tags) {
        const [tagName, value] = tag;

        if (tagName === "d") continue;

        const numValue = parseFloat(value);

        switch (tagName) {
            case "rank":
                metrics.rank = parseInt(value, 10);
                break;
            case "followers":
                metrics.followers = parseInt(value, 10);
                break;
            case "post_cnt":
                metrics.postCount = parseInt(value, 10);
                break;
            case "zap_amt_recd":
                metrics.zapAmtRecd = parseInt(value, 10);
                break;
            case "zap_amt_sent":
                metrics.zapAmtSent = parseInt(value, 10);
                break;
            case "first_created_at":
                metrics.firstCreatedAt = parseInt(value, 10);
                break;
            case "reply_cnt":
                metrics.replyCount = parseInt(value, 10);
                break;
            case "reactions_cnt":
                metrics.reactionsCount = parseInt(value, 10);
                break;
            case "zap_cnt_recd":
                metrics.zapCntRecd = parseInt(value, 10);
                break;
            case "zap_cnt_sent":
                metrics.zapCntSent = parseInt(value, 10);
                break;
            case "hops":
                metrics.hops = parseInt(value, 10);
                break;
            case "personalizedGrapeRank_influence":
                metrics.personalizedGrapeRank_influence = numValue;
                break;
            case "personalizedGrapeRank_average":
                metrics.personalizedGrapeRank_average = numValue;
                break;
            case "personalizedGrapeRank_confidence":
                metrics.personalizedGrapeRank_confidence = numValue;
                break;
            case "personalizedGrapeRank_input":
                metrics.personalizedGrapeRank_input = numValue;
                break;
            case "personalizedPageRank":
                metrics.personalizedPageRank = numValue;
                break;
            case "verifiedFollowerCount":
                metrics.verifiedFollowerCount = parseInt(value, 10);
                break;
            case "verifiedMuterCount":
                metrics.verifiedMuterCount = parseInt(value, 10);
                break;
            case "verifiedReporterCount":
                metrics.verifiedReporterCount = parseInt(value, 10);
                break;
        }
    }

    return metrics;
}

/**
 * Fetch trust metrics for a single pubkey
 */
export async function fetchTrustScore(pubkey: string): Promise<TrustMetrics | null> {
    try {
        const pool = getPool();

        const filter: Filter = {
            kinds: [30382],
            "#d": [pubkey],
            limit: 1,
        };

        const events = await pool.querySync([TRUST_RELAY], filter);
        pool.close([TRUST_RELAY]);

        if (events.length === 0) {
            return null;
        }

        return parseMetrics(events[0]);
    } catch (error) {
        console.error(`Failed to fetch trust score for ${pubkey}:`, error);
        return null;
    }
}

/**
 * Fetch trust metrics for multiple pubkeys in batch
 */
export async function fetchTrustScoresBatch(
    pubkeys: string[]
): Promise<Map<string, TrustMetrics | null>> {
    const results = new Map<string, TrustMetrics | null>();

    try {
        const pool = getPool();

        const filter: Filter = {
            kinds: [30382],
            "#d": pubkeys,
        };

        const events = await pool.querySync([TRUST_RELAY], filter);
        pool.close([TRUST_RELAY]);

        // Map events to pubkeys
        for (const event of events) {
            const dTag = event.tags.find(tag => tag[0] === "d");
            if (dTag && dTag[1]) {
                const pubkey = dTag[1];
                results.set(pubkey, parseMetrics(event));
            }
        }

        // Set null for pubkeys without metrics
        for (const pubkey of pubkeys) {
            if (!results.has(pubkey)) {
                results.set(pubkey, null);
            }
        }
    } catch (error) {
        console.error("Failed to fetch trust scores batch:", error);
        // Set all to null on error
        for (const pubkey of pubkeys) {
            results.set(pubkey, null);
        }
    }

    return results;
}

/**
 * Get trust badge level based on rank
 */
export function getTrustBadge(rank?: number): {
    level: "high" | "medium" | "low" | null;
    label: string;
    color: string;
} | null {
    if (!rank) return null;

    if (rank >= 80) {
        return {
            level: "high",
            label: `trust-score: ${rank}`,
            color: "bg-green-500/10 border-green-500/30 text-green-400",
        };
    }

    if (rank >= 50) {
        return {
            level: "medium",
            // label: "Verified",
            label: `trust-score: ${rank}`,
            color: "bg-blue-500/10 border-blue-500/30 text-blue-400",
        };
    }

    if (rank >= 20) {
        return {
            level: "low",
            label: `trust-score: ${rank}`,
            color: "bg-gray-500/10 border-gray-500/30 text-gray-400",
        };
    }

    return null;
}