import { render, screen, within } from "@testing-library/react";

import { Dashboard } from "@/components/dashboard";
import type { MotsSourceResult } from "@/domain/source";
import type { TeamDefinition } from "@/domain/team";

const team: TeamDefinition = {
  id: "credential-management",
  name: "Credential Management",
  motsModules: ["password_manager", "form_autofill"],
  workstreams: [],
};

const availableResult: MotsSourceResult = {
  status: "available",
  acquiredAt: "2026-07-22T12:00:00.000Z",
  sourceUpdatedAt: "2026-07-20T21:41:23.943277+00:00",
  team: {
    definition: team,
    modules: [
      {
        machineName: "password_manager",
        displayName: "Password Manager",
        description: "Managing, saving and filling logins.",
        includes: ["toolkit/components/passwordmgr/**/*"],
        excludes: [],
        bugzillaComponents: ["Toolkit::Password Manager"],
        reviewGroup: "password-reviewers",
      },
      {
        machineName: "form_autofill",
        displayName: "Form Autofill",
        description: "Form detection and autocomplete.",
        includes: ["browser/extensions/formautofill/**/*"],
        excludes: [],
        bugzillaComponents: ["Toolkit::Form Autofill"],
      },
    ],
  },
};

describe("dashboard", () => {
  it("renders the configured selector, normalized modules, freshness, and honest empty states", () => {
    render(
      <Dashboard
        teams={[team]}
        selectedTeam={team}
        motsResult={availableResult}
      />,
    );

    expect(screen.getByRole("combobox", { name: "Configured team" })).toHaveValue("credential-management");
    expect(screen.getByRole("heading", { name: "Credential Management" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Password Manager" })).toBeVisible();
    expect(screen.getByText("Toolkit::Password Manager")).toBeVisible();
    expect(screen.getByText("toolkit/components/passwordmgr/**/*")).toBeVisible();
    expect(screen.getByText("password-reviewers")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Form Autofill" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Refresh source" })).toBeEnabled();
    expect(screen.getAllByText("No workstream configured").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bugzilla not connected").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Phabricator not connected").length).toBeGreaterThan(0);
    expect(screen.getByText("Patch journey unavailable until a workstream is selected")).toBeVisible();
    expect(screen.getAllByText("Landing state not connected").length).toBeGreaterThan(0);

    const patchTable = screen.getByRole("table");
    expect(within(patchTable).queryByText(/D\d+/)).not.toBeInTheDocument();
    expect(within(patchTable).queryByText(/\d+ (hours?|days?)/i)).not.toBeInTheDocument();
  });

  it("renders source-unavailable state visibly and does not substitute modules", () => {
    const unavailableResult: MotsSourceResult = {
      status: "unavailable",
      acquiredAt: "2026-07-22T12:00:00.000Z",
      error: { code: "network", message: "MOTS could not be reached." },
    };

    render(
      <Dashboard
        teams={[team]}
        selectedTeam={team}
        motsResult={unavailableResult}
      />,
    );

    expect(screen.getByRole("heading", { name: "MOTS unavailable" })).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent("No fixture or stale data was substituted");
    expect(screen.queryByRole("heading", { name: "Password Manager" })).not.toBeInTheDocument();
    expect(screen.getByText(/Module details are unavailable/)).toBeVisible();
  });
});
