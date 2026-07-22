import { parse } from "yaml";
import { z } from "zod";

import type { MotsModule } from "@/domain/team";

interface RawMotsModule {
  machine_name: string;
  name: string;
  description?: string | null;
  includes?: string[] | null;
  excludes?: string[] | null;
  meta?: {
    components?: string[] | null;
    review_group?: string | null;
  } | null;
  submodules?: RawMotsModule[] | null;
}

const rawMotsModuleSchema: z.ZodType<RawMotsModule> = z.lazy(() =>
  z
    .object({
      machine_name: z.string().min(1),
      name: z.string().min(1),
      description: z.string().nullish(),
      includes: z.array(z.string()).nullish(),
      excludes: z.array(z.string()).nullish(),
      meta: z
        .object({
          components: z.array(z.string()).nullish(),
          review_group: z.string().min(1).nullish(),
        })
        .passthrough()
        .nullable()
        .optional(),
      submodules: z.array(rawMotsModuleSchema).nullish(),
    })
    .passthrough(),
);

const rawMotsDocumentSchema = z
  .object({
    updated_at: z.iso.datetime({ offset: true }).optional(),
    modules: z.array(rawMotsModuleSchema).min(1),
  })
  .passthrough();

export class MotsYamlParseError extends Error {
  readonly code = "MOTS_YAML_PARSE_ERROR" as const;
}

export class MotsSchemaError extends Error {
  readonly code = "MOTS_SCHEMA_ERROR" as const;
}

interface ParsedMotsDocument {
  modules: MotsModule[];
  sourceUpdatedAt?: string;
}

function flattenModules(modules: RawMotsModule[]): RawMotsModule[] {
  return modules.flatMap((module) => [
    module,
    ...flattenModules(module.submodules ?? []),
  ]);
}

export function parseMotsDocument(source: string): ParsedMotsDocument {
  let document: unknown;

  try {
    document = parse(source, { maxAliasCount: 10_000 });
  } catch (error) {
    throw new MotsYamlParseError("The MOTS response is not valid YAML.", {
      cause: error,
    });
  }

  const parsed = rawMotsDocumentSchema.safeParse(document);
  if (!parsed.success) {
    throw new MotsSchemaError(
      `The MOTS response has an unexpected shape: ${z.prettifyError(parsed.error)}`,
      { cause: parsed.error },
    );
  }

  return {
    modules: flattenModules(parsed.data.modules).map((module) => ({
      machineName: module.machine_name,
      displayName: module.name,
      description: module.description ?? undefined,
      includes: [...(module.includes ?? [])],
      excludes: [...(module.excludes ?? [])],
      bugzillaComponents: [...(module.meta?.components ?? [])],
      reviewGroup: module.meta?.review_group ?? undefined,
    })),
    sourceUpdatedAt: parsed.data.updated_at,
  };
}
