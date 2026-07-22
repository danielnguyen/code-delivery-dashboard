# Code Delivery Dashboard Agent Instructions

## Authority

Before planning or implementation, read the current authoritative product specification:

- `danielnguyen/projects/productivity/code-delivery-flow-observatory.md`

Repository evidence and the current specification outrank conversational summaries.

## Working rules

- Start from a synchronized, clean `main` branch.
- Use a short-lived branch and open a draft pull request for implementation work.
- Keep each change bounded and independently reviewable.
- Do not add adjacent features, new services, databases, warehouses, or connectors outside the task scope.
- Stop and report when implementation requires files or product decisions outside the declared scope.
- Preserve explicit unknown states instead of fabricating delivery state from incomplete evidence.

## Security and data handling

This repository is public.

- Keep Bugzilla and Phabricator credentials server-side and environment-provided.
- Never commit tokens, `.env` files, acquired operational payloads, caches, or restricted Mozilla data.
- Use synthetic or sanitized recorded responses for tests.
- Do not infer or expose inaccessible bug or revision content.

## First-slice boundaries

The first executable slice covers:

- Credential Management;
- MOTS modules `password_manager` and `form_autofill`;
- configured Bugzilla metabug workstreams;
- MOTS, Bugzilla REST, and Phabricator Conduit source boundaries;
- review-flow state, dependencies, blockers, ownership mapping, and bounded metrics.

Deferred unless explicitly requested:

- Lando and landing queues;
- PushLog, Treeherder, Taskcluster, and Treestatus;
- backout and reland reconstruction;
- Jira and GitHub-hosted component delivery;
- organization-wide analytics;
- predictions, numeric risk scores, reviewer rankings, and team grades.

## Validation

Every implementation PR must report:

- synchronized starting SHA;
- exact changed files;
- lint, type-check, test, and production-build results;
- any source/API behavior that could not be verified;
- remaining deferred behavior.
