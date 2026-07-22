# Code Delivery Dashboard

A local-first web application for observing how Firefox patches move through review, ownership dependencies, and delivery-system queues. The dashboard is designed to preserve evidence gaps and unknown states instead of fabricating delivery status.

The authoritative product specification lives in [`danielnguyen/projects`](https://github.com/danielnguyen/projects/blob/main/productivity/code-delivery-flow-observatory.md).

## Current boundary

This application foundation proves one live vertical boundary:

- the configured Credential Management team;
- exact resolution of the `password_manager` and `form_autofill` modules;
- server-side acquisition of the current Firefox `mots.yaml`;
- normalized module paths, Bugzilla components, and review-group metadata;
- an operational dashboard shell with explicit connected, unavailable, and not-yet-connected states.

This boundary does **not** complete the full first executable product in the specification. No Bugzilla metabug is configured yet, so the workstream selector and all patch-level views intentionally remain empty.

## Prerequisites

- Node.js 20.19 or newer on the Node 20 line, Node.js 22.13 or newer on the Node 22 line, or Node.js 24 or newer
- npm
- network access from the Next.js server to the public live MOTS source

## Install and run

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The normal runtime fetches live MOTS data on the server for each dashboard request; the browser does not contact MOTS directly.

For a production run:

```bash
npm run build
npm start
```

## Validation commands

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Tests use a synthetic MOTS fixture and do not require network access.

## Configuration and live source

Team configuration lives in [`config/teams.yaml`](config/teams.yaml). It is schema-validated and currently defines Credential Management with exactly `password_manager` and `form_autofill`, plus an intentional empty `workstreams` list. Invalid configuration fails explicitly.

The server adapter acquires [`mots.yaml`](https://github.com/mozilla-firefox/firefox/blob/main/mots.yaml) from Mozilla's official Firefox repository. Live acquisition has a timeout and explicit states for transport errors, non-success HTTP responses, malformed YAML, unexpected source shape, and missing configured modules. It never substitutes the test fixture or claims stale data is current.

## Security and data handling

This repository is public. Never commit credentials, `.env` files, operational payloads, acquired source caches, or restricted Mozilla data. Future Bugzilla and Phabricator credentials must remain environment-provided and server-side; inaccessible records must remain unavailable rather than inferred.

## Deferred connectors

Bugzilla REST and Phabricator Conduit are not connected in this application-foundation pull request. Lando, PushLog, Treeherder, Taskcluster, Treestatus, backout and reland reconstruction, Jira, GitHub-hosted component discovery, release analysis, organization-wide analytics, and prediction or ranking features are also deferred.
