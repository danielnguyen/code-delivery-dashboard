import Link from "next/link";

import type { MotsSourceResult } from "@/domain/source";
import type { MotsModule, TeamDefinition } from "@/domain/team";

interface DashboardProps {
  teams: TeamDefinition[];
  selectedTeam: TeamDefinition;
  motsResult: MotsSourceResult;
}

function formatTimestamp(timestamp: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(timestamp)) + " UTC";
}

function SourceStatus({ result, selectedTeamId }: { result: MotsSourceResult; selectedTeamId: string }) {
  const available = result.status === "available";
  const title =
    result.status === "available"
      ? "MOTS connected"
      : result.status === "configured_module_missing"
        ? "MOTS configuration mismatch"
        : result.status === "invalid_source_data"
          ? "MOTS source data invalid"
          : "MOTS unavailable";

  return (
    <section className="source-strip" aria-labelledby="source-status-title">
      <div>
        <div className="eyebrow">Source status</div>
        <div className="source-heading">
          <span
            className={`status-dot ${available ? "status-dot--available" : "status-dot--unavailable"}`}
            aria-hidden="true"
          />
          <h2 id="source-status-title">{title}</h2>
          <span className={`status-pill ${available ? "status-pill--available" : "status-pill--unavailable"}`}>
            {available ? "Available" : "Attention required"}
          </span>
        </div>
        {result.status === "available" ? (
          <p>
            Live module ownership is available. No stale snapshot is being used.
          </p>
        ) : (
          <p role="alert">{result.error.message} No fixture or stale data was substituted.</p>
        )}
      </div>
      <div className="freshness">
        <span>Last acquisition attempt</span>
        <time dateTime={result.acquiredAt}>{formatTimestamp(result.acquiredAt)}</time>
        {result.sourceUpdatedAt ? (
          <small>
            Source updated <time dateTime={result.sourceUpdatedAt}>{formatTimestamp(result.sourceUpdatedAt)}</time>
          </small>
        ) : null}
        <form action="/" method="get">
          <input type="hidden" name="team" value={selectedTeamId} />
          <button className="secondary-button" type="submit">Refresh source</button>
        </form>
      </div>
    </section>
  );
}

function DetailList({ title, values, emptyText }: { title: string; values: string[]; emptyText: string }) {
  return (
    <div className="module-detail">
      <h4>{title}</h4>
      {values.length > 0 ? (
        <ul>
          {values.map((value) => (
            <li key={value}><code>{value}</code></li>
          ))}
        </ul>
      ) : (
        <p className="muted">{emptyText}</p>
      )}
    </div>
  );
}

function ModuleCard({ module }: { module: MotsModule }) {
  return (
    <article className="module-card">
      <div className="module-card__heading">
        <div>
          <span className="machine-name">{module.machineName}</span>
          <h3>{module.displayName}</h3>
        </div>
        <span className="status-pill status-pill--available">Resolved exactly</span>
      </div>
      {module.description ? <p>{module.description}</p> : null}
      {module.reviewGroup ? (
        <p className="review-group"><span>Review group</span> {module.reviewGroup}</p>
      ) : null}
      <div className="module-grid">
        <DetailList
          title="Bugzilla components"
          values={module.bugzillaComponents}
          emptyText="No Bugzilla components recorded."
        />
        <DetailList title="Included paths" values={module.includes} emptyText="No included paths recorded." />
        {module.excludes.length > 0 ? (
          <DetailList title="Excluded paths" values={module.excludes} emptyText="No excluded paths recorded." />
        ) : null}
      </div>
    </article>
  );
}

function EmptyPanel({ title, state, detail }: { title: string; state: string; detail: string }) {
  return (
    <section className="empty-panel" aria-labelledby={`${title.toLowerCase().replaceAll(" ", "-")}-title`}>
      <div className="empty-panel__icon" aria-hidden="true">—</div>
      <div>
        <h3 id={`${title.toLowerCase().replaceAll(" ", "-")}-title`}>{title}</h3>
        <strong>{state}</strong>
        <p>{detail}</p>
      </div>
    </section>
  );
}

export function Dashboard({ teams, selectedTeam, motsResult }: DashboardProps) {
  const modules = motsResult.status === "available" ? motsResult.team.modules : [];

  return (
    <main>
      <header className="app-header">
        <div>
          <Link className="brand" href="/">Code Delivery Dashboard</Link>
          <p>Firefox delivery-flow observatory</p>
        </div>
        <form className="team-selector" action="/" method="get">
          <label htmlFor="team">Configured team</label>
          <div>
            <select id="team" name="team" defaultValue={selectedTeam.id}>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
            <button type="submit">Apply</button>
          </div>
        </form>
      </header>

      <div className="page-shell">
        <SourceStatus result={motsResult} selectedTeamId={selectedTeam.id} />

        <section className="team-summary" aria-labelledby="team-summary-title">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Selected team</div>
              <h1 id="team-summary-title">{selectedTeam.name}</h1>
              <p>Configured ownership lens resolved from live MOTS module records.</p>
            </div>
            <span className="scope-badge">{selectedTeam.motsModules.length} configured modules</span>
          </div>

          {modules.length > 0 ? (
            <div className="module-stack">
              {modules.map((module) => <ModuleCard key={module.machineName} module={module} />)}
            </div>
          ) : (
            <div className="inline-empty" role="status">
              Module details are unavailable until all configured MOTS records resolve successfully.
            </div>
          )}
        </section>

        <section className="workstream-control" aria-labelledby="workstream-title">
          <div>
            <div className="eyebrow">Operational scope</div>
            <h2 id="workstream-title">Workstream</h2>
            <p>No operational workstream has been configured yet. Add a real Bugzilla metabug to team configuration in a later bounded change.</p>
          </div>
          <div>
            <label htmlFor="workstream">Configured Bugzilla metabug</label>
            <select id="workstream" disabled defaultValue="">
              <option value="">No workstream configured</option>
            </select>
          </div>
        </section>

        <section aria-labelledby="aggregate-title">
          <div className="section-heading section-heading--compact">
            <div>
              <div className="eyebrow">Future operational view</div>
              <h2 id="aggregate-title">Aggregate statistics</h2>
            </div>
            <span className="status-pill status-pill--neutral">No workstream configured</span>
          </div>
          <div className="stats-grid">
            {[
              ["Active patches", "Bugzilla not connected"],
              ["External review waits", "Phabricator not connected"],
              ["Median review queue", "Phabricator not connected"],
              ["Current diffs accepted", "Landing state not connected"],
            ].map(([label, state]) => (
              <article className="stat-card" key={label}>
                <span>{label}</span>
                <strong aria-label={`${label} unavailable`}>—</strong>
                <small>{state}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="table-card" aria-labelledby="patch-table-title">
          <div className="table-card__heading">
            <div>
              <div className="eyebrow">Workstream evidence</div>
              <h2 id="patch-table-title">Workstream patch table</h2>
            </div>
            <span className="status-pill status-pill--neutral">Bugzilla not connected</span>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr><th>Patch</th><th>Bug</th><th>Stage</th><th>Blocker</th><th>Waiting on</th><th>Next action</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={6} className="table-empty">
                    <strong>No workstream configured</strong>
                    <span>No patch records are available, and no sample records are shown.</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <div className="operational-grid">
          <EmptyPanel
            title="Selected patch journey"
            state="Patch journey unavailable until a workstream is selected"
            detail="Review and dependency evidence will appear here after Bugzilla and Phabricator are connected."
          />
          <EmptyPanel
            title="Current blocker"
            state="No patch selected"
            detail="Verified observations, interpretation, and possible intervention will remain separate."
          />
          <EmptyPanel
            title="Ownership and dependency map"
            state="Phabricator not connected"
            detail="MOTS ownership edges are ready; changed paths and revision dependencies are not yet available."
          />
        </div>

        <aside className="guardrail">
          <strong>Delivery-flow context, not a performance scorecard.</strong>
          <p>This view preserves unknown states and is intended for predictability, capacity planning, and cross-team coordination—not individual or team ranking.</p>
        </aside>
      </div>
    </main>
  );
}
