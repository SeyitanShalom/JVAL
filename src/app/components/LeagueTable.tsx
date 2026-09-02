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

export default function LeagueTable({
  teams,
  compact = false,
}: LeagueTableProps) {
  const tableClassName = compact
    ? "w-full table-fixed text-xs"
    : "w-full min-w-[860px] text-sm";

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className={compact ? "" : "overflow-x-auto"}>
        <table className={tableClassName}>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
              <th
                className={
                  compact
                    ? "w-8 px-2 py-3 text-center"
                    : "px-4 py-3 text-center"
                }
              >
                #
              </th>
              <th className={compact ? "px-2 py-3" : "px-4 py-3"}>Club</th>
              <th
                className={
                  compact
                    ? "w-10 px-1 py-3 text-center"
                    : "px-2 py-3 text-center"
                }
              >
                P
              </th>
              <th
                className={
                  compact
                    ? "w-10 px-1 py-3 text-center"
                    : "px-2 py-3 text-center"
                }
              >
                W
              </th>
              {!compact ? <th className="px-2 py-3 text-center">D</th> : null}
              {!compact ? <th className="px-2 py-3 text-center">L</th> : null}
              {!compact ? (
                <th className="px-2 py-3 text-center">GF</th>
              ) : null}
              {!compact ? (
                <th className="px-2 py-3 text-center">GA</th>
              ) : null}
              <th
                className={
                  compact
                    ? "w-12 px-2 py-3 text-center"
                    : "px-2 py-3 text-center"
                }
              >
                GD
              </th>
              <th
                className={
                  compact
                    ? "w-12 px-2 py-3 text-center"
                    : "px-2 py-3 text-center"
                }
              >
                PTS
              </th>
              {!compact ? (
                <th className="px-4 py-3 text-center">Form</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {teams.map((team, index) => {
              const goalDifference = team.goalsFor - team.goalsAgainst;

              return (
                <tr
                  key={team.id}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td
                    className={
                      compact
                        ? "w-8 px-2 py-3 text-center font-bold text-slate-900"
                        : "px-4 py-3 text-center font-bold text-slate-900"
                    }
                  >
                    {index + 1}
                  </td>
                  <td className={compact ? "px-2 py-3" : "px-4 py-3"}>
                    <Link
                      href={`/teams/${team.slug}`}
                      className="flex min-w-0 items-center gap-2"
                    >
                      <Image
                        src={team.logo}
                        width={28}
                        height={28}
                        alt={`${team.name} logo`}
                        className="h-5 w-5 shrink-0 object-contain"
                      />
                      <div className="min-w-0">
                        <p className="whitespace-nowrap font-semibold text-slate-950">
                          {team.name}
                        </p>
                        {!compact ? (
                          <p className="text-xs font-semibold text-slate-500">
                            Pot {team.pot}
                          </p>
                        ) : null}
                      </div>
                    </Link>
                  </td>
                  <td
                    className={
                      compact
                        ? "px-1 py-3 text-center font-semibold"
                        : "px-2 py-3 text-center font-semibold"
                    }
                  >
                    {team.played}
                  </td>
                  <td
                    className={
                      compact
                        ? "px-1 py-3 text-center font-semibold"
                        : "px-2 py-3 text-center font-semibold"
                    }
                  >
                    {team.wins}
                  </td>
                  {!compact ? (
                    <td className="px-2 py-3 text-center font-semibold">
                      {team.draws}
                    </td>
                  ) : null}
                  {!compact ? (
                    <td className="px-2 py-3 text-center font-semibold">
                      {team.losses}
                    </td>
                  ) : null}
                  {!compact ? (
                    <td className="px-2 py-3 text-center font-semibold">
                      {team.goalsFor}
                    </td>
                  ) : null}
                  {!compact ? (
                    <td className="px-2 py-3 text-center font-semibold">
                      {team.goalsAgainst}
                    </td>
                  ) : null}
                  <td
                    className={
                      compact
                        ? "px-2 py-3 text-center font-semibold"
                        : "px-2 py-3 text-center font-semibold"
                    }
                  >
                    {goalDifference > 0 ? `+${goalDifference}` : goalDifference}
                  </td>
                  <td
                    className={
                      compact
                        ? "px-2 py-3 text-center font-bold text-slate-950"
                        : "px-2 py-3 text-center font-bold text-slate-950"
                    }
                  >
                    {team.points}
                  </td>
                  {!compact ? (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        {team.form.map((result, formIndex) => (
                          <span
                            key={`${team.id}-${result}-${formIndex}`}
                            className={`grid h-6 w-6 place-items-center rounded-md text-xs font-bold ${formBadgeClass(result)}`}
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
