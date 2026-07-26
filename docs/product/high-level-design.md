# Knowledge Graph — Developer Learning Companion

> **A browser extension that turns everything you learn into a searchable, version-controlled knowledge graph.**

Instead of saving bookmarks, you build interconnected knowledge.

---

# Vision

Imagine you're reading about **CAP Theorem**.

You click the extension.

```
Section
▼ HLD

Topic
▼ Distributed Systems

Knowledge Node
▼ CAP Theorem

Title
CAP Theorem Explained

Keywords
cap, consistency, partition tolerance

Tags
distributed systems, interview

Save
```

The extension automatically

- saves the article
- stores metadata
- creates/updates markdown
- links related topics
- syncs to GitHub
- makes it searchable

Years later you can search

```
CAP
```

and instantly find

- CAP Theorem
- Cassandra
- Redis Cluster
- Quorum
- Consistent Hashing

because they're all connected.

---

# Core Philosophy

This project is **not** a bookmark manager.

It is a **Knowledge Graph**.

Knowledge isn't hierarchical.

It is connected.

Instead of

```
HLD
    Redis
```

or

```
Database
    Redis
```

Redis should exist once.

It simply belongs to multiple contexts.

```
Redis

Sections

✓ Backend
✓ Database
✓ HLD

Related

Kafka
Memcached
CAP theorem

Children

Persistence
Streams
PubSub
```

---

# Goals

## Primary Goals

- Capture knowledge in under 10 seconds
- Never lose a useful article
- Organize without rigid folders
- Search instantly
- Store everything in Markdown
- Sync with GitHub
- Work offline

---

# Functional Requirements

## Knowledge Management

- Create Node
- Edit Node
- Delete Node
- Archive Node

Each node contains

- Title
- Summary
- Notes
- Keywords
- Tags
- Sections
- Parent Topics
- Child Topics
- Related Topics
- Resources
- Attachments (future)

---

## Browser Integration

Automatically detect

- Current URL
- Page title
- Website
- Favicon
- Selected text (optional)

Right Click

```
Save to Knowledge Graph
```

---

## Sections

User-defined

Example

```
DSA

Backend

Frontend

LLD

HLD

Redis

MongoDB

Kafka

Networking

Operating Systems

AWS

System Design
```

A node may belong to many sections.

---

## Relationships

Support

```
Parent

Child

Related

Depends On

Uses

Implements

Alternative To
```

Example

```
Redis

↓

Streams

↓

Consumer Groups

↓

Kafka
```

---

## Resources

Each node stores

- Article
- Documentation
- Video
- GitHub Repository
- Blog
- Leetcode
- GFG
- Notes

---

## Search

Search by

- Title
- Tags
- Keywords
- Notes
- URL
- Section
- Related Nodes

---

## GitHub Sync

Automatically

- Create markdown
- Update README
- Update graph.json
- Commit changes

---

# Non Functional Requirements

## Performance

Popup

```
<150ms
```

Search

```
<50ms
```

Save

```
<200ms
```

---

## Reliability

Offline-first

Everything saves locally.

Sync happens later.

---

## Scalability

Support

- 10000+ Nodes
- 100000+ Relationships

---

## Portability

Everything stored in Markdown.

Nothing proprietary.

---

# High Level Architecture

```
                    Browser Extension
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
     Popup UI        Context Menu      Background Worker
        │                  │                  │
        └──────────────┬───┴──────────────────┘
                       │
                  Application Core
                       │
        ┌──────────────┼──────────────────┐
        │              │                  │
        ▼              ▼                  ▼
  Graph Engine   Search Engine     Markdown Engine
        │              │                  │
        └──────────────┼──────────────────┘
                       │
                 IndexedDB Storage
                       │
                 Sync Queue Service
                       │
                   GitHub API
                       │
                  GitHub Repository
```

---

# Core Modules

## UI Module

Responsible for

- Popup
- Forms
- Search
- Settings

---

## Knowledge Engine

Responsible for

- Node CRUD
- Validation
- Duplicate detection

---

## Graph Engine

Maintains

```
Nodes

Edges

Relationships

Traversal
```

---

## Search Engine

Responsible for

- Fuzzy Search
- Filters
- Ranking
- Suggestions

---

## Markdown Engine

Creates

```
Node Markdown

README

Section Pages

Graph Metadata
```

---

## Sync Engine

Responsible for

- Queue
- Retry
- GitHub Sync
- Conflict Resolution

---

## Storage Layer

Uses

```
IndexedDB
```

Stores

- Nodes
- Relationships
- Queue
- Search Index
- Settings

---

# Low Level Design

```
src

background

popup

content

core

    node

    graph

    markdown

    search

    storage

    sync

    github

shared

hooks

components

utils

types
```

---

# Domain Models

## KnowledgeNode

```typescript
KnowledgeNode

id

title

slug

summary

notes

sections[]

keywords[]

tags[]

resources[]

relations[]

createdAt

updatedAt
```

---

## Section

```typescript
Section;

id;

name;

icon;

color;
```

---

## Relation

```typescript
Relation;

sourceId;

targetId;

type;

weight;
```

---

## Resource

```typescript
Resource;

url;

title;

type;

website;
```

---

# Database Design

IndexedDB

```
knowledge_nodes

sections

relations

resources

sync_queue

settings
```

---

# Repository Structure

```
knowledge/

README.md

graph.json

nodes/

redis.md

kafka.md

cap-theorem.md

binary-search.md

sections/

backend.md

database.md

hld.md
```

---

# Markdown Format

```markdown
---
title: Redis

sections:
  - Backend
  - Database
  - HLD

keywords:
  - redis
  - cache

tags:
  - interview

related:
  - Kafka
  - Memcached

children:
  - Streams
  - PubSub
---

# Redis

## Notes

...

## Resources

...

## Revision Notes

...
```

---

# Event Flow

```
User Saves Node

↓

Validation

↓

IndexedDB

↓

Update Search Index

↓

Update Graph

↓

Generate Markdown

↓

Queue GitHub Sync

↓

Background Commit
```

Every component reacts independently through an internal event bus.

---

# Search Architecture

Index

```
Title

Keywords

Tags

Sections

Summary

Notes

Related Topics
```

Use

```
Fuse.js
```

---

# Graph Design

Every topic becomes a node.

```
Redis

↓

Persistence

↓

AOF

↓

Replication

↓

Kafka

↓

CAP theorem

↓

Distributed Cache
```

This allows

- dependency graphs
- related learning
- interview preparation
- revision paths

---

# GitHub Synchronization

```
Save Node

↓

Queue Sync Job

↓

Generate Markdown

↓

Update graph.json

↓

Update README

↓

Commit

↓

Push
```

GitHub is used as

- backup
- version history
- publishing

It is **not** the primary database.

---

# Technology Stack

| Layer      | Technology                                         |
| ---------- | -------------------------------------------------- |
| Extension  | Manifest V3 (Chrome) + WebExtensions API (Firefox) |
| UI         | React + TypeScript                                 |
| Styling    | Tailwind CSS                                       |
| State      | Zustand                                            |
| Local DB   | IndexedDB + Dexie.js                               |
| Search     | Fuse.js                                            |
| Markdown   | gray-matter + markdown-it                          |
| GitHub     | Octokit                                            |
| Validation | Zod                                                |
| Forms      | React Hook Form                                    |
| Build      | Vite                                               |
| Testing    | Vitest + Playwright                                |

---

# Development Roadmap

## Phase 1 — MVP (Week 1–2)

Goal: Capture knowledge reliably.

- Extension popup
- Auto-detect current page
- Create/edit knowledge nodes
- Local storage in IndexedDB
- Basic search
- Manual export/import (JSON)

---

## Phase 2 — GitHub Integration (Week 3)

Goal: Make the knowledge base portable.

> Implementation status: version 0.2 ships durable, atomic GitHub synchronization
> using a fine-grained personal access token. GitHub App/OAuth authentication is
> still planned for a wider public release.

- GitHub OAuth
- Generate markdown files
- Generate `README.md`
- Generate `graph.json`
- Background sync queue
- Automatic commits

---

## Phase 3 — Knowledge Graph (Week 4–5)

Goal: Build relationships.

- Parent/child links
- Related topics
- Dependency links
- Graph traversal
- Backlinks ("Referenced by")
- Smart suggestions for related nodes

---

## Phase 4 — Productivity Features (Week 6)

Goal: Daily usability.

- Context menu ("Save to Knowledge Graph")
- Highlight text capture
- Duplicate URL detection
- Revision status
- Favorites
- Recent items
- Keyboard shortcuts

---

## Phase 5 — AI Assistant (Future)

Goal: Reduce manual effort.

- Summarize articles
- Extract key concepts
- Auto-generate tags and keywords
- Suggest relationships
- Generate flashcards
- Create quizzes
- Produce Mermaid diagrams
- Build learning paths automatically

---

# Future Vision

Over time, this becomes more than a browser extension. It becomes a personal developer knowledge platform with:

- **Knowledge Graph:** Every concept connected through explicit relationships.
- **Version-Controlled Notes:** Markdown synced to GitHub, giving you history and ownership.
- **Offline-First:** Instant capture and search without relying on a server.
- **AI-Assisted Learning:** Automatic summaries, relationships, and revision material.
- **Multiple Views:** The same knowledge can be viewed by section (HLD, DSA), by technology (Redis, Kafka), by interview preparation, or by learning path—all without duplicating notes.

This architecture keeps the extension lightweight, scales to thousands of knowledge nodes, requires **no backend for the core product**, and leaves a clean path for future cloud and AI capabilities without needing to redesign the system.
