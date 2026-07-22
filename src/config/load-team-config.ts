import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { parse } from "yaml";

import { parseTeamConfig, TeamConfigError } from "@/config/team-config";
import type { TeamDefinition } from "@/domain/team";

const TEAM_CONFIG_PATH = path.join(process.cwd(), "config", "teams.yaml");

export async function loadTeamConfig(): Promise<TeamDefinition[]> {
  let source: string;

  try {
    source = await readFile(TEAM_CONFIG_PATH, "utf8");
  } catch (error) {
    throw new TeamConfigError("Team configuration could not be read.", {
      cause: error,
    });
  }

  let document: unknown;

  try {
    document = parse(source);
  } catch (error) {
    throw new TeamConfigError("Team configuration is not valid YAML.", {
      cause: error,
    });
  }

  return parseTeamConfig(document);
}
