# Code Delivery Dashboard

A local-first web application for observing how Firefox patches move through review, ownership dependencies, and delivery-system queues.

The authoritative product specification lives in [`danielnguyen/projects`](https://github.com/danielnguyen/projects/blob/main/productivity/code-delivery-flow-observatory.md).

## Current status

Repository bootstrap only. Runtime implementation will be added through a pull request.

The first executable slice is scoped to:

- Credential Management
- MOTS modules `password_manager` and `form_autofill`
- Bugzilla metabug workstreams
- live MOTS, Bugzilla REST, and Phabricator Conduit evidence
- an operational patch table, patch journey, blocker panel, ownership map, and bounded review-flow metrics

Landing, autoland CI, backout, Jira, and organization-wide analytics are deferred.
