import "server-only";

import type { MotsSourceResult } from "@/domain/source";
import type { TeamDefinition } from "@/domain/team";
import {
  MotsSchemaError,
  MotsYamlParseError,
  parseMotsDocument,
} from "@/sources/mots/parse-mots";

const MOTS_SOURCE_URL =
  "https://raw.githubusercontent.com/mozilla-firefox/firefox/main/mots.yaml";
const DEFAULT_TIMEOUT_MS = 8_000;

export type MotsFetch = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

interface AcquisitionOptions {
  fetchImpl?: MotsFetch;
  now?: () => Date;
  timeoutMs?: number;
}

function isTimeoutError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "AbortError" || error.name === "TimeoutError")
  );
}

export async function acquireMotsForTeam(
  team: TeamDefinition,
  options: AcquisitionOptions = {},
): Promise<MotsSourceResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const acquiredAt = (options.now ?? (() => new Date()))().toISOString();
  const signal = AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetchImpl(MOTS_SOURCE_URL, {
      cache: "no-store",
      headers: { Accept: "application/yaml, text/yaml, text/plain" },
      signal,
    });
  } catch (error) {
    const timedOut = isTimeoutError(error);
    return {
      status: "unavailable",
      acquiredAt,
      error: {
        code: timedOut ? "timeout" : "network",
        message: timedOut
          ? "MOTS acquisition timed out."
          : "MOTS could not be reached.",
      },
    };
  }

  if (!response.ok) {
    return {
      status: "unavailable",
      acquiredAt,
      error: {
        code: "http_error",
        message: `MOTS returned HTTP ${response.status}.`,
        httpStatus: response.status,
      },
    };
  }

  let parsed;
  try {
    parsed = parseMotsDocument(await response.text());
  } catch (error) {
    if (error instanceof MotsYamlParseError) {
      return {
        status: "invalid_source_data",
        acquiredAt,
        error: { code: "yaml_parse", message: error.message },
      };
    }

    if (error instanceof MotsSchemaError) {
      return {
        status: "invalid_source_data",
        acquiredAt,
        error: { code: "schema", message: error.message },
      };
    }

    return {
      status: "unavailable",
      acquiredAt,
      error: {
        code: "network",
        message: "The MOTS response could not be read.",
      },
    };
  }

  const modulesByMachineName = new Map(
    parsed.modules.map((module) => [module.machineName, module]),
  );
  const missingModuleNames = team.motsModules.filter(
    (machineName) => !modulesByMachineName.has(machineName),
  );

  if (missingModuleNames.length > 0) {
    return {
      status: "configured_module_missing",
      acquiredAt,
      sourceUpdatedAt: parsed.sourceUpdatedAt,
      missingModuleNames,
      error: {
        code: "configured_module_missing",
        message: `Configured MOTS module${missingModuleNames.length === 1 ? "" : "s"} not found: ${missingModuleNames.join(", ")}.`,
      },
    };
  }

  return {
    status: "available",
    acquiredAt,
    sourceUpdatedAt: parsed.sourceUpdatedAt,
    team: {
      definition: team,
      modules: team.motsModules.map(
        (machineName) => modulesByMachineName.get(machineName)!,
      ),
    },
  };
}
