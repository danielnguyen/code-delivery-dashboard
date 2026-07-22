import type { ResolvedTeam } from "@/domain/team";

interface SourceEvidence {
  acquiredAt: string;
  sourceUpdatedAt?: string;
}

export type MotsSourceResult =
  | ({
      status: "available";
      team: ResolvedTeam;
    } & SourceEvidence)
  | ({
      status: "unavailable";
      error: {
        code: "timeout" | "network" | "http_error";
        message: string;
        httpStatus?: number;
      };
    } & SourceEvidence)
  | ({
      status: "invalid_source_data";
      error: {
        code: "yaml_parse" | "schema";
        message: string;
      };
    } & SourceEvidence)
  | ({
      status: "configured_module_missing";
      missingModuleNames: string[];
      error: {
        code: "configured_module_missing";
        message: string;
      };
    } & SourceEvidence);
