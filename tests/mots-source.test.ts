import { readFileSync } from "node:fs";
import path from "node:path";

import type { TeamDefinition } from "@/domain/team";
import { acquireMotsForTeam, type MotsFetch } from "@/sources/mots/acquire-mots";

const fixture = readFileSync(
  path.join(process.cwd(), "tests", "fixtures", "mots.yaml"),
  "utf8",
);

const team: TeamDefinition = {
  id: "credential-management",
  name: "Credential Management",
  motsModules: ["password_manager", "form_autofill"],
  workstreams: [],
};

const now = () => new Date("2026-07-22T12:00:00.000Z");

function responseFetch(body: string, init?: ResponseInit): MotsFetch {
  return vi.fn(async () => new Response(body, init));
}

describe("MOTS acquisition", () => {
  it("resolves both configured modules by exact machine_name and normalizes raw data", async () => {
    const fetchImpl = responseFetch(fixture);

    const result = await acquireMotsForTeam(team, { fetchImpl, now });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://raw.githubusercontent.com/mozilla-firefox/firefox/main/mots.yaml",
      expect.objectContaining({ cache: "no-store", signal: expect.any(AbortSignal) }),
    );
    expect(result.status).toBe("available");
    if (result.status !== "available") throw new Error("Expected available MOTS data");

    expect(result.acquiredAt).toBe("2026-07-22T12:00:00.000Z");
    expect(result.sourceUpdatedAt).toBe("2026-07-20T21:41:23.943277+00:00");
    expect(result.team.modules).toEqual([
      {
        machineName: "password_manager",
        displayName: "Password Manager",
        description: "Managing, saving and filling logins.",
        includes: [
          "toolkit/components/passwordmgr/**/*",
          "browser/components/aboutlogins/**/*",
        ],
        excludes: ["toolkit/components/passwordmgr/test-only/**/*"],
        bugzillaComponents: [
          "Toolkit::Password Manager",
          "Firefox::about:logins",
        ],
        reviewGroup: "password-reviewers",
      },
      {
        machineName: "form_autofill",
        displayName: "Form Autofill",
        description: "Form detection and autocomplete.",
        includes: [
          "browser/extensions/formautofill/**/*",
          "toolkit/components/autocomplete/**/*",
        ],
        excludes: ["browser/extensions/formautofill/test-only/**/*"],
        bugzillaComponents: [
          "Toolkit::Autocomplete",
          "Toolkit::Form Autofill",
        ],
        reviewGroup: undefined,
      },
    ]);
    expect(result.team.modules[0]).not.toHaveProperty("meta");
    expect(result.team.modules[0]).not.toHaveProperty("owners");
  });

  it("accepts the current Firefox timestamp form with an offset and long fractional seconds", async () => {
    const result = await acquireMotsForTeam(team, {
      fetchImpl: responseFetch(fixture),
      now,
    });

    expect(result).toMatchObject({
      status: "available",
      sourceUpdatedAt: "2026-07-20T21:41:23.943277+00:00",
    });
  });

  it("allows source data without an updated_at timestamp", async () => {
    const sourceWithoutTimestamp = fixture.replace(/^updated_at:[^\n]*\n/, "");

    const result = await acquireMotsForTeam(team, {
      fetchImpl: responseFetch(sourceWithoutTimestamp),
      now,
    });

    expect(result.status).toBe("available");
    expect(result.sourceUpdatedAt).toBeUndefined();
  });

  it("classifies a malformed updated_at timestamp as invalid source data", async () => {
    const sourceWithInvalidTimestamp = fixture.replace(
      /^updated_at:[^\n]*\n/,
      "updated_at: definitely-not-a-timestamp\n",
    );

    const result = await acquireMotsForTeam(team, {
      fetchImpl: responseFetch(sourceWithInvalidTimestamp),
      now,
    });

    expect(result).toMatchObject({
      status: "invalid_source_data",
      error: { code: "schema" },
    });
    expect(result).not.toHaveProperty("team");
  });

  it("returns no partial team when a configured module is missing", async () => {
    const result = await acquireMotsForTeam(
      { ...team, motsModules: ["password_manager", "missing_module"] },
      { fetchImpl: responseFetch(fixture), now },
    );

    expect(result).toMatchObject({
      status: "configured_module_missing",
      missingModuleNames: ["missing_module"],
      error: { code: "configured_module_missing" },
    });
    expect(result).not.toHaveProperty("team");
  });

  it("distinguishes malformed YAML from transport failures", async () => {
    const result = await acquireMotsForTeam(team, {
      fetchImpl: responseFetch("modules: [unterminated"),
      now,
    });

    expect(result).toMatchObject({
      status: "invalid_source_data",
      error: { code: "yaml_parse" },
    });
  });

  it("reports an unexpected source shape explicitly", async () => {
    const result = await acquireMotsForTeam(team, {
      fetchImpl: responseFetch("modules:\n  - name: Missing machine name\n"),
      now,
    });

    expect(result).toMatchObject({
      status: "invalid_source_data",
      error: { code: "schema" },
    });
  });

  it("reports a non-success HTTP response as unavailable", async () => {
    const result = await acquireMotsForTeam(team, {
      fetchImpl: responseFetch("Service unavailable", { status: 503 }),
      now,
    });

    expect(result).toMatchObject({
      status: "unavailable",
      error: { code: "http_error", httpStatus: 503 },
    });
  });

  it("reports a rejected fetch as unavailable without fixture fallback", async () => {
    const fetchImpl: MotsFetch = vi.fn(async () => {
      throw new TypeError("network down");
    });

    const result = await acquireMotsForTeam(team, { fetchImpl, now });

    expect(result).toMatchObject({
      status: "unavailable",
      error: { code: "network" },
    });
    expect(result).not.toHaveProperty("team");
  });
});
