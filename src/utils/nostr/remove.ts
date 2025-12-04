import type { Moonshot } from "../../types/types";
import { getPool } from "./pool";
import { DEFAULT_RELAYS } from "./relayConfig";

export async function removeMoonshot(moonshot: Moonshot): Promise<void> {
    if (!window.nostr) {
        throw new Error("Nostr extension not found");
    }

    const pool = getPool();

    // Build tags array (same d-tag for replaceable event)
    const eventTags = [
        ["d", moonshot.id],
        ["t", "moonshot"],
        ["title", moonshot.title],
        ["topics", ...moonshot.topics],
        ["budget", moonshot.budget],
        ["timeline", moonshot.timeline],
        ["status", moonshot.status],
        ["isExplorable", "false"], // Mark as not explorable
    ];

    const event = {
        kind: 30078,
        created_at: Math.floor(Date.now() / 1000),
        tags: eventTags,
        content: moonshot.content,
    };

    console.log("Deleting moonshot (marking as not explorable):", event);

    const signedEvent = await window.nostr.signEvent(event);
    const pubs = pool.publish(DEFAULT_RELAYS, signedEvent);

    await Promise.race([
        Promise.all(pubs),
        new Promise(resolve => setTimeout(resolve, 5000))
    ]);

    console.log("Moonshot marked as not explorable:", moonshot.id);
}