# Vikkypaedia Way to Bookmarks

**Waymark** is the working product name.

> Don’t organize your bookmarks. Rescue them.

Waymark is an early, privacy-first experiment in **personal action memory**. It
imports a browser bookmark export, helps people recover forgotten and duplicate
saves, supports intent-aware retrieval, and turns a handful of sources into a
small action pack.

This repository is deliberately narrow. The goal is to test whether a bookmark
tool can help people *use* more of what they save—not merely file it more
beautifully.

## What the alpha can do

- Import Netscape-format HTML exports from Chrome and Firefox.
- Keep the imported library in the current browser’s local storage.
- Search titles, folders, notes, domains, tags, and inferred intent.
- Expand a few natural intent words such as `learn`, `decide`, and `trip`.
- Detect tracked or slightly different URLs that point to the same destination.
- Surface bookmarks older than one year.
- Select sources and generate a focused, cited action pack.

## Privacy boundary

The current alpha parses bookmark files in the browser. Imported bookmarks are
not uploaded to Waymark’s server. The deployed demo contains only fictional
sample bookmarks.

This is not yet a security-audited product. Do not treat the alpha as a
permanent archive.

## Run locally

Requirements: Node.js 22.13+ and pnpm.

```bash
pnpm install
pnpm dev
```

Open the local URL printed by the development server.

## Test and build

```bash
pnpm test
pnpm build
```

The test suite covers bookmark parsing, URL canonicalization, duplicate
detection, forgotten-item detection, intent-aware ranking, action-pack
generation, and server rendering.

## The experiment

Waymark should proceed only if users can:

1. Find a known saved item in under 30 seconds.
2. Recover at least one genuinely useful forgotten item during onboarding.
3. Convert a meaningful portion of new saves into an action within 14 days.
4. Describe the value as “helped me do something,” rather than “organized my
   links.”

See the repository issues for upcoming retrieval experiments, accessibility
work, portable data formats, and connector proposals.
