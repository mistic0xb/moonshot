# NIP-XX: Project Bounties and Builder Marketplace

`draft` `optional`

## Abstract

This NIP defines a protocol for creating project bounties, allowing builders to express interest, and facilitating project assignments on Nostr. It enables a decentralized marketplace where creators can post projects and builders can compete for work.

## Motivation

The Nostr ecosystem needs a standardized way for:
- Creators to post project proposals with budgets and timelines
- Builders to discover opportunities and express interest
- Communities to track project status and completion
- Integration with Bitcoin Lightning payments for bounties

This creates a trustless, decentralized job marketplace without intermediaries.

## Specification

### Event Kinds

This NIP uses existing event kinds from the Nostr protocol:

- `30023`: Long-form content (NIP-23) - Project Proposals
- `1`: Short text note (NIP-01) - Builder Interest
- `7`: Reaction (NIP-25) - Project Upvotes
- `4`: Encrypted Direct Message (NIP-04) - Private communication

### Project Proposal (Kind 30023)

A project proposal is published as a long-form content event with specific tags.

**Required tags:**
- `d` - Unique identifier for the project (replaceable event)
- `t` - Must include "moonshot" for discoverability
- `title` - Project title
- `budget` - Budget in satoshis
- `timeline` - Timeline description (e.g., "3 months", "90 days")

**Optional tags:**
- `status` - Current status: "open", "assigned", "in-progress", "completed", "cancelled"
- `category` - Project category: "development", "design", "research", "writing", "other"
- `required-skills` - Comma-separated list of required skills
- `angor` - Angor project ID if using external fundraising
- `accepted-builder` - npub of accepted builder (when status is "assigned")

**Content:**
Markdown-formatted project description including requirements, deliverables, and any additional details.

**Example:**
```json
{
  "kind": 30023,
  "created_at": 1234567890,
  "pubkey": "<creator-pubkey>",
  "tags": [
    ["d", "moonshot-20240101-abc123"],
    ["t", "moonshot"],
    ["title", "Build a Nostr Chess Client"],
    ["budget", "500000"],
    ["timeline", "3 months"],
    ["status", "open"],
    ["category", "development"],
    ["required-skills", "React, TypeScript, Nostr"]
  ],
  "content": "# Project Overview\n\nBuild a real-time chess client...",
  "sig": "..."
}
```

### Builder Interest (Kind 1)

Builders express interest by replying to the project proposal with a short note.

**Required tags:**
- `e` - Project proposal event ID (with relay hint and marker "root")
- `p` - Creator's pubkey
- `t` - Must include "moonshot-interest"

**Optional tags:**
- `github` - Builder's GitHub profile URL
- `portfolio` - Builder's portfolio URL
- `nostr-address` - Builder's NIP-05 identifier

**Content:**
Plain text message explaining why the builder is qualified and interested.

**Example:**
```json
{
  "kind": 1,
  "created_at": 1234567891,
  "pubkey": "<builder-pubkey>",
  "tags": [
    ["e", "<project-event-id>", "<relay-url>", "root"],
    ["p", "<creator-pubkey>"],
    ["t", "moonshot-interest"],
    ["github", "https://github.com/builder"],
    ["nostr-address", "builder@example.com"]
  ],
  "content": "I have 5 years of experience building React apps and have contributed to several Nostr clients...",
  "sig": "..."
}
```

### Project Upvotes (Kind 7)

Community members can upvote projects using reactions.

**Required tags:**
- `e` - Project proposal event ID
- `p` - Creator's pubkey

**Content:**
The content should be "+" to indicate an upvote.

**Example:**
```json
{
  "kind": 7,
  "created_at": 1234567892,
  "pubkey": "<upvoter-pubkey>",
  "tags": [
    ["e", "<project-event-id>"],
    ["p", "<creator-pubkey>"]
  ],
  "content": "+",
  "sig": "..."
}
```

### Builder Selection (Update Project Status)

When a creator selects a builder, they update the project proposal by publishing a new event with the same `d` tag (replaceable event).

**Changes:**
- Update `status` tag to "assigned"
- Add `accepted-builder` tag with selected builder's npub

**Example:**
```json
{
  "kind": 30023,
  "created_at": 1234567895,
  "pubkey": "<creator-pubkey>",
  "tags": [
    ["d", "moonshot-20240101-abc123"],
    ["t", "moonshot"],
    ["title", "Build a Nostr Chess Client"],
    ["budget", "500000"],
    ["timeline", "3 months"],
    ["status", "assigned"],
    ["category", "development"],
    ["required-skills", "React, TypeScript, Nostr"],
    ["accepted-builder", "<builder-npub>"]
  ],
  "content": "# Project Overview\n\nBuild a real-time chess client...",
  "sig": "..."
}
```

### Private Communication (Kind 4)

After selection, creators and builders communicate privately using encrypted DMs (NIP-04) or gift-wrapped DMs (NIP-17).

## Client Behavior

### Discovery

Clients should query relays for:
```json
{
  "kinds": [30023],
  "#t": ["moonshot"]
}
```

To filter by status:
```json
{
  "kinds": [30023],
  "#t": ["moonshot"],
  "#status": ["open"]
}
```

### Displaying Projects

Clients should display:
1. Project title and creator
2. Budget and timeline
3. Current status
4. Number of upvotes (count of kind 7 reactions)
5. Number of interested builders (count of kind 1 replies with "moonshot-interest" tag)

### Builder Applications

Clients should:
1. Show all builder interest events (kind 1) for a project
2. Allow creators to filter/sort by builder reputation, GitHub activity, etc.
3. Provide UI for creator to update project status and accept a builder

### Notifications

When a builder is selected, clients should:
1. Send an encrypted DM to the selected builder
2. Optionally send generic rejection messages to other interested builders

## Payment Integration

This NIP does not specify payment mechanisms. Projects can integrate with:
- Direct Lightning payments (peer-to-peer)
- Escrow services
- External platforms like Angor (referenced via `angor` tag)
- Zaps (NIP-57) for milestone payments

## Status Lifecycle

```
open → assigned → in-progress → completed
  ↓
cancelled (at any stage)
```

## Implementation Notes

- Use NIP-65 (Relay List Metadata) to ensure project proposals reach builders
- Clients may implement reputation systems using NIP-05, WoT, or custom metrics
- Consider rate limiting project creation to prevent spam
- Builders should include proof of work (GitHub, portfolio) to increase trust

## Example Use Cases

1. **Open Source Development**: Fund development of Nostr clients, tools, relays
2. **Content Creation**: Commission articles, designs, videos
3. **Research**: Fund technical research or protocol improvements
4. **Bounties**: Quick tasks with small budgets
5. **Long-term Projects**: Multi-month engagements with milestones

## Advantages

- **Decentralized**: No central authority or platform fees
- **Censorship-resistant**: Built on Nostr protocol
- **Interoperable**: Any client can implement this NIP
- **Flexible**: Works with any payment method
- **Transparent**: All proposals and applications are public

## Security Considerations

- Creators should verify builder credentials before selection
- Use escrow or milestone-based payments for large projects
- Encrypted DMs (NIP-04/NIP-17) for sensitive contract details
- Clients may implement spam prevention for project proposals

## References

- [NIP-01: Basic Protocol](https://github.com/nostr-protocol/nips/blob/master/01.md)
- [NIP-04: Encrypted Direct Messages](https://github.com/nostr-protocol/nips/blob/master/04.md)
- [NIP-23: Long-form Content](https://github.com/nostr-protocol/nips/blob/master/23.md)
- [NIP-25: Reactions](https://github.com/nostr-protocol/nips/blob/master/25.md)
- [NIP-57: Lightning Zaps](https://github.com/nostr-protocol/nips/blob/master/57.md)

## Author

[Your Name/npub]

## License

Public Domain