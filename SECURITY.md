# Security Policy

## Supported version

Waymark is currently an alpha. Only the latest version on the `main` branch is
supported.

## Reporting a vulnerability

Please do not open a public issue for a security or privacy vulnerability.
Contact the repository owner privately through the contact method on their
GitHub profile and include:

- A clear description of the problem.
- Steps to reproduce it.
- The potential privacy or security impact.
- Any suggested mitigation.

Do not include real bookmark exports, browsing history, credentials, or other
personal data in a report.

## Current security boundary

Bookmark HTML is parsed in the browser and stored in that browser’s local
storage. The project does not intentionally upload imported bookmark data.
Waymark has not yet received an independent security audit and should not be
used as the only copy of important information.
