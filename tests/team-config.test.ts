import { readFileSync } from "node:fs";
import path from "node:path";

import { parse } from "yaml";

import { parseTeamConfig, TeamConfigError } from "@/config/team-config";

describe("team configuration", () => {
  it("parses the production Credential Management configuration exactly", () => {
    const source = readFileSync(
      path.join(process.cwd(), "config", "teams.yaml"),
      "utf8",
    );

    expect(parseTeamConfig(parse(source))).toEqual([
      {
        id: "credential-management",
        name: "Credential Management",
        motsModules: ["password_manager", "form_autofill"],
        workstreams: [],
      },
    ]);
  });

  it("fails explicitly instead of dropping invalid configuration", () => {
    expect(() =>
      parseTeamConfig({
        teams: [
          {
            id: "Credential Management",
            name: "",
            mots_modules: [],
            workstreams: [],
          },
        ],
      }),
    ).toThrow(TeamConfigError);
  });

  it("rejects duplicate module machine names", () => {
    expect(() =>
      parseTeamConfig({
        teams: [
          {
            id: "credential-management",
            name: "Credential Management",
            mots_modules: ["password_manager", "password_manager"],
            workstreams: [],
          },
        ],
      }),
    ).toThrow(/must be unique/);
  });
});
