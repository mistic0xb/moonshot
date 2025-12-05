import { v4 as uuidv4 } from 'uuid';
import { getPool } from './pool';
import { DEFAULT_RELAYS } from './relayConfig';
import type { Moonshot, ProofOfWorkLink } from '../../types/types';

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
        ["status", "open"],
        ["isExplorable", "true"]
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
        ["a", `30078:${creatorPubkey}:${moonshotId}`],
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

// Publish version history snapshot before updating
async function publishVersionSnapshot(
    moonshotId: string,
    creatorPubkey: string,
    currentEventId: string,
    title: string,
    content: string,
    budget: string,
    timeline: string,
    topics: string[],
    status: string,
    createdAt: number
): Promise<void> {
    if (!window.nostr) {
        throw new Error("Nostr extension not found");
    }

    const pool = getPool();
    const versionId = uuidv4();

    // Build tags for version snapshot
    const eventTags = [
        ["d", versionId], // Unique d-tag for this version
        ["t", "moonshot-version"], // Tag to identify as version history
        ["a", `30078:${creatorPubkey}:${moonshotId}`],
        ["e", currentEventId], // Link to the event being replaced
        ["title", title],
        ["topics", ...topics],
        ["budget", budget],
        ["timeline", timeline],
        ["status", status],
        ["original-timestamp", createdAt.toString()] // Preserve original creation time
    ];

    const event = {
        kind: 30078,
        created_at: Math.floor(Date.now() / 1000),
        tags: eventTags,
        content: content,
    };

    console.log("Publishing version snapshot:", event);

    const signedEvent = await window.nostr.signEvent(event);
    const pubs = pool.publish(DEFAULT_RELAYS, signedEvent);

    await Promise.race([
        Promise.all(pubs),
        new Promise(resolve => setTimeout(resolve, 5000))
    ]);

    console.log("Version snapshot published");
}

// Update moonshot event (replaceable event - same d-tag)
export async function updateMoonshot(
    moonshotId: string,
    creatorPubkey: string,
    currentEventId: string,
    currentTitle: string,
    currentContent: string,
    currentBudget: string,
    currentTimeline: string,
    currentTopics: string[],
    currentStatus: string,
    currentCreatedAt: number,
    newTitle: string,
    newContent: string,
    newBudget: string,
    newTimeline: string,
    newTopics: string[],
    newStatus: string,
): Promise<string> {
    if (!window.nostr) {
        throw new Error("Nostr extension not found");
    }

    // Step 1: Publish the current version as a snapshot for history
    await publishVersionSnapshot(
        moonshotId,
        creatorPubkey,
        currentEventId,
        currentTitle,
        currentContent,
        currentBudget,
        currentTimeline,
        currentTopics,
        currentStatus,
        currentCreatedAt
    );

    // Step 2: Update the main moonshot event
    const pool = getPool();

    const eventTags = [
        ["d", moonshotId], // Same d-tag to replace the event
        ["t", "moonshot"],
        ["title", newTitle],
        ["topics", ...newTopics],
        ["budget", newBudget],
        ["timeline", newTimeline],
        ["status", newStatus],
        ["isExplorable", "true"]
    ];

    const event = {
        kind: 30078,
        created_at: Math.floor(Date.now() / 1000), // New timestamp
        tags: eventTags,
        content: newContent,
    };

    console.log("Updating moonshot event:", event);

    const signedEvent = await window.nostr.signEvent(event);
    const pubs = pool.publish(DEFAULT_RELAYS, signedEvent);

    await Promise.race([
        Promise.all(pubs),
        new Promise(resolve => setTimeout(resolve, 5000))
    ]);

    console.log("Moonshot updated with ID:", moonshotId);
    return moonshotId;
}

// Share moonshot on Nostr (kind 1 event)
export async function publishNostrShare(
    moonshot: Moonshot,
    moonshotUrl: string
): Promise<void> {
    if (!window.nostr) {
        throw new Error("Nostr extension not found");
    }

    const pool = getPool();

    // Build the message
    let message = `🚀 New MoonShot: ${moonshot.title}\n\n`;
    message += `💰 Budget: ${moonshot.budget} sats\n`;
    message += `⏱️ Timeline: ${moonshot.timeline} months\n`;

    if (moonshot.topics && moonshot.topics.length > 0) {
        message += `\n${moonshot.topics.map(topic => `#${topic}`).join(' ')}\n`;
    }

    message += `\n${moonshotUrl}`;

    // Build tags
    const tags: string[][] = [
        ["t", "moonshot"],
    ];

    // Add topic tags
    if (moonshot.topics && moonshot.topics.length > 0) {
        moonshot.topics.forEach(topic => {
            tags.push(["t", topic.toLowerCase()]);
        });
    }

    const event = {
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags,
        content: message,
    };

    console.log("Publishing Nostr share:", event);

    const signedEvent = await window.nostr.signEvent(event);
    const pubs = pool.publish(DEFAULT_RELAYS, signedEvent);

    await Promise.race([
        Promise.all(pubs),
        new Promise(resolve => setTimeout(resolve, 5000))
    ]);

    console.log("Moonshot shared on Nostr successfully");
}