import Image from "next/image";
import Link from "next/link";
import { getTeamById, type Player } from "@/lib/league-data";

type PlayerStatsCardProps = {
  player: Player;
  rank: number;
  metric: "goals" | "assists" | "cleanSheets";
};

const metricLabels: Record<PlayerStatsCardProps["metric"], string> = {
  goals: "goals",
  assists: "assists",
  cleanSheets: "clean sheets",
};

export default function PlayerStatsCard({ player, rank, metric }: PlayerStatsCardProps) {
  const team = getTeamById(player.teamId);

  if (!team) {
    return null;
  }

  return (
    <Link href={`/players/${player.slug}`} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white p-3">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-blue-50 text-xs font-bold text-blue-700">
        {rank}
      </span>
      <Image
        src={player.photo}
        width={42}
        height={42}
        alt={`${player.name} photo`}
        className="h-10 w-10 rounded-lg object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-950">{player.name}</p>
        <p className="truncate text-xs text-slate-500">{team.name}</p>
      </div>
      <p className="text-right text-sm font-bold text-slate-950">
        {player[metric]}
        <span className="ml-1 text-xs font-bold text-slate-500">{metricLabels[metric]}</span>
      </p>
    </Link>
  );
}
