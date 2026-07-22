import { z } from "zod";

import type { TeamDefinition } from "@/domain/team";

const workstreamSchema = z
  .object({
    type: z.literal("bugzilla_metabug"),
    id: z.number().int().positive(),
    name: z.string().trim().min(1).optional(),
  })
  .strict();

const teamSchema = z
  .object({
    id: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    name: z.string().trim().min(1),
    mots_modules: z.array(z.string().trim().min(1)).min(1),
    workstreams: z.array(workstreamSchema),
  })
  .strict()
  .superRefine((team, context) => {
    if (new Set(team.mots_modules).size !== team.mots_modules.length) {
      context.addIssue({
        code: "custom",
        message: "MOTS module machine names must be unique within a team.",
        path: ["mots_modules"],
      });
    }
  });

const teamConfigSchema = z
  .object({
    teams: z.array(teamSchema).min(1),
  })
  .strict()
  .superRefine((config, context) => {
    const ids = config.teams.map((team) => team.id);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: "custom",
        message: "Team IDs must be unique.",
        path: ["teams"],
      });
    }
  });

export class TeamConfigError extends Error {
  readonly code = "INVALID_TEAM_CONFIGURATION" as const;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "TeamConfigError";
  }
}

export function parseTeamConfig(input: unknown): TeamDefinition[] {
  const parsed = teamConfigSchema.safeParse(input);

  if (!parsed.success) {
    throw new TeamConfigError(
      `Team configuration is invalid: ${z.prettifyError(parsed.error)}`,
      { cause: parsed.error },
    );
  }

  return parsed.data.teams.map((team) => ({
    id: team.id,
    name: team.name,
    motsModules: [...team.mots_modules],
    workstreams: team.workstreams.map((workstream) => ({ ...workstream })),
  }));
}
