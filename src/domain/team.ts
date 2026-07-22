export interface WorkstreamDefinition {
  type: "bugzilla_metabug";
  id: number;
  name?: string;
}

export interface TeamDefinition {
  id: string;
  name: string;
  motsModules: string[];
  workstreams: WorkstreamDefinition[];
}

export interface MotsModule {
  machineName: string;
  displayName: string;
  description?: string;
  includes: string[];
  excludes: string[];
  bugzillaComponents: string[];
  reviewGroup?: string;
}

export interface ResolvedTeam {
  definition: TeamDefinition;
  modules: MotsModule[];
}
