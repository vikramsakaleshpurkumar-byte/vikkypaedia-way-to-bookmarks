# Contributing to Vikkypaedia Way to Bookmarks

Thank you for helping people turn forgotten links into useful action.

## Good first contributions

- Improve bookmark retrieval and ranking.
- Make onboarding clearer for nontechnical users.
- Add accessibility improvements and keyboard support.
- Add import fixtures for more browsers and bookmark formats.
- Improve tests, documentation, and translations.

Please avoid adding cloud storage, analytics, or account requirements without
first discussing the privacy impact in an issue.

## Local setup

Requirements: Node.js 22.13 or newer and pnpm.

```bash
pnpm install
pnpm dev
```

Before submitting a change:

```bash
pnpm test
pnpm build
```

## Pull requests

1. Open an issue for substantial product or architecture changes.
2. Keep each pull request focused on one outcome.
3. Explain the user problem, the change, and how you tested it.
4. Include screenshots for visible interface changes.
5. Preserve the private-on-device behavior unless the proposal explicitly
   addresses consent, security, portability, and deletion.

Small documentation, test, and accessibility improvements are welcome without
an issue.

## Product principle

Waymark succeeds when it helps someone *use* a saved item. More folders,
metadata, and automation are not automatically improvements.
