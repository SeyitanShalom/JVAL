import Image from "next/image";
import Link from "next/link";
import { type Team } from "@/lib/league-data";

type LeagueTableProps = {
  teams: Team[];
  compact?: boolean;
};

const formBadgeClass = (result: "W" | "L" | "D") => {
  if (result === "W") return "bg-green-600 text-white";
  if (result === "L") return "bg-red-600 text-white";
  return "bg-slate-500 text-white";
};

export default function LeagueTable({ teams, compact = false }: LeagueTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[660px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Club</th>
              <th className="px-3 py-3 text-center">P</th>
              <th className="px-3 py-3 text-center">W</th>
              <th className="px-3 py-3 text-center">D</th>
              <th className="px-3 py-3 text-center">L</th>
              <th className="px-3 py-3 text-center">GD</th>
              <th className="px-3 py-3 text-center">PTS</th>
              {!compact ? <th className="px-4 py-3">Form</th> : null}
            </tr>
          </thead>
          <tbody>
            {teams.map((team, index) => {
              const goalDifference = team.goalsFor - team.goalsAgainst;

              return (
                <tr key={team.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-black text-slate-900">{index + 1}</td>
                  <td className="px-4 py-3">
                    <Link href={`/teams/${team.slug}`} className="flex items-center gap-2">
                      <Image src={team.logo} width={28} height={28} alt={`${team.name} logo`} className="h-7 w-7 object-contain" />
                      <div>
                        <p className="font-black text-slate-950">{team.name}</p>
                        <p className="text-xs font-semibold text-slate-500">Pot {team.pot}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-center font-semibold">{team.played}</td>
                  <td className="px-3 py-3 text-center font-semibold">{team.wins}</td>
                  <td className="px-3 py-3 text-center font-semibold">{team.draws}</td>
                  <td className="px-3 py-3 text-center font-semibold">{team.losses}</td>
                  <td className="px-3 py-3 text-center font-semibold">{goalDifference > 0 ? `+${goalDifference}` : goalDifference}</td>
                  <td className="px-3 py-3 text-center font-black text-slate-950">{team.points}</td>
                  {!compact ? (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {team.form.map((result, formIndex) => (
                          <span
                            key={`${team.id}-${result}-${formIndex}`}
                            className={`grid h-6 w-6 place-items-center rounded-md text-xs font-black ${formBadgeClass(result)}`}
                          >
                            {result}
                          </span>
                        ))}
                      </div>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
