import { v4 as uuidv4 } from 'uuid';
import type { Event } from "nostr-tools";
import { getPool } from './pool';
import { DEFAULT_RELAYS } from './relayConfig';
import type { Comment } from '../../types/types';

// Fetch comments for a moonshot (kind 30078)
export async function fetchComments(
    creatorPubkey: string, 
    moonshotId: string
): Promise<Comment[]> {
    const pool = getPool();
    
    return new Promise(resolve => {
        const comments: Comment[] = [];
        const seen = new Set<string>();
        let sub: any;
        
        const timeout = setTimeout(() => {
            if (sub) sub.close();
            console.log("Fetched comments for moonshot:", moonshotId, "Count:", comments.length);
            resolve(comments);
        }, 5000);

        const filter = {
            kinds: [30078],
            "#a": [`30078:${creatorPubkey}:${moonshotId}`],
            "#t": ["moonshot-comment"],
            limit: 200, // Get more for threading
        };

        sub = pool.subscribeMany(DEFAULT_RELAYS, filter, {
            onevent(event: Event) {
                if (seen.has(event.id)) return;
                seen.add(event.id);

                try {
                    const dTag = event.tags.find(t => t[0] === "d");
                    const aTag = event.tags.find(t => t[0] === "a");
                    const chipInTag = event.tags.find(t => t[0] === "chip-in");
                    const replyTag = event.tags.find(t => t[0] === "e" && t[3] === "reply");

                    if (!dTag || !aTag) {
                        console.warn("Comment event missing required tags:", event);
                        return;
                    }

                    const comment: Comment = {
                        id: dTag[1],
                        eventId: event.id,
                        moonshotId: aTag[1].split(":")[2],
                        authorPubkey: event.pubkey,
                        content: event.content,
                        chipIn: chipInTag ? parseInt(chipInTag[1]) : 0,
                        parentCommentId: replyTag ? replyTag[1] : undefined,
                        createdAt: event.created_at * 1000,
                    };

                    comments.push(comment);
                } catch (err) {
                    console.error("Failed to parse comment:", err);
                }
            },
            oneose() {
                clearTimeout(timeout);
                if (sub) sub.close();
                console.log("Comment subscription closed. Total:", comments.length);
                resolve(comments);
            },
        });
    });
}

// Publish a comment
export async function publishComment(
    moonshotId: string,
    creatorPubkey: string,
    content: string,
    chipIn: number,
    parentCommentId?: string,
    parentAuthorPubkey?: string
): Promise<string> {
    if (!window.nostr) {
        throw new Error("Nostr extension not found");
    }

    const commentId = uuidv4();

    const tags: string[][] = [
        ["d", commentId],
        ["t", "moonshot-comment"],
        ["a", `30078:${creatorPubkey}:${moonshotId}`],
        ["p", creatorPubkey], // Notify moonshot creator
    ];

    // Add chip-in if not 0
    if (chipIn > 0) {
        tags.push(["chip-in", chipIn.toString()]);
    }

    // If replying to another comment
    if (parentCommentId && parentAuthorPubkey) {
        tags.push(["e", parentCommentId, "", "reply"]);
        tags.push(["p", parentAuthorPubkey]); // Notify parent comment author
    }

    const event = {
        kind: 30078,
        created_at: Math.floor(Date.now() / 1000),
        tags,
        content: content.trim(),
    };

    console.log("Publishing comment:", event);

    const signedEvent = await window.nostr.signEvent(event);
    const pool = getPool();
    const pubs = pool.publish(DEFAULT_RELAYS, signedEvent);

    await Promise.race([
        Promise.all(pubs),
        new Promise(resolve => setTimeout(resolve, 5000))
    ]);

    console.log("Comment published successfully with ID:", commentId);
    return commentId;
}

// Build comment tree (nest replies under parents)
export function buildCommentTree(comments: Comment[]): Comment[] {
    // Map for quick lookup
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    // First pass: create map and initialize replies array
    comments.forEach(comment => {
        commentMap.set(comment.eventId, { ...comment, replies: [] });
    });

    // Second pass: build tree
    comments.forEach(comment => {
        const commentWithReplies = commentMap.get(comment.eventId)!;
        
        if (comment.parentCommentId) {
            // This is a reply, add to parent
            const parent = commentMap.get(comment.parentCommentId);
            if (parent) {
                parent.replies!.push(commentWithReplies);
            } else {
                // Parent not found (maybe not loaded), treat as root
                rootComments.push(commentWithReplies);
            }
        } else {
            // Root comment
            rootComments.push(commentWithReplies);
        }
    });

    // Sort root comments by time (newest first)
    rootComments.sort((a, b) => b.createdAt - a.createdAt);

    // Sort replies in each thread (oldest first for natural conversation flow)
    const sortReplies = (comment: Comment) => {
        if (comment.replies && comment.replies.length > 0) {
            comment.replies.sort((a, b) => a.createdAt - b.createdAt);
            comment.replies.forEach(sortReplies);
        }
    };
    rootComments.forEach(sortReplies);

    return rootComments;
}