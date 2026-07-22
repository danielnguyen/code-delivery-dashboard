import { Dashboard } from "@/components/dashboard";
import { loadTeamConfig } from "@/config/load-team-config";
import { acquireMotsForTeam } from "@/sources/mots/acquire-mots";

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams: Promise<{ team?: string | string[] }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const teams = await loadTeamConfig();
  const requestedTeam = (await searchParams).team;
  const requestedTeamId = Array.isArray(requestedTeam)
    ? requestedTeam[0]
    : requestedTeam;
  const selectedTeam =
    teams.find((team) => team.id === requestedTeamId) ?? teams[0];
  const motsResult = await acquireMotsForTeam(selectedTeam);

  return (
    <Dashboard
      teams={teams}
      selectedTeam={selectedTeam}
      motsResult={motsResult}
    />
  );
}
