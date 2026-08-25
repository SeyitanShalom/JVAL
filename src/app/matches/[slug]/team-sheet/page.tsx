import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import { matches, formatDate, formatMatchTime } from "@/lib/league-data";
import { getPublicMatchDetail } from "@/lib/public-data";
import PrintButton from "./PrintButton";

export function generateStaticParams() {
  return matches.map((m) => ({ slug: m.slug }));
}

export default async function TeamSheetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPublicMatchDetail(slug);
  if (!data) notFound();

  const { match, homeTeam, awayTeam, competition, venue, homePlayers, awayPlayers } = data;
  const POSITION_ORDER = ["Goalkeeper", "Defender", "Midfielder", "Forward"] as const;

  return (
    <>
      {/* Screen-only toolbar */}
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-4 py-4 print:hidden sm:px-6">
        <Link
          href={"/matches/" + slug}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-blue-600 hover:text-blue-600"
        >
          <FiArrowLeft aria-hidden="true" />
          Back to match
        </Link>
        <PrintButton />
      </div>

      {/* Printable sheet */}
      <div
        id="team-sheet"
        className="mx-auto w-full max-w-4xl space-y-8 px-4 pb-16 pt-2 print:max-w-none print:px-8 print:pt-6 sm:px-6"
      >
        {/* Header */}
        <div className="space-y-1 border-b-2 border-slate-950 pb-4 text-center print:border-black">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            {competition.name} &middot; {match.matchday} &middot;{" "}
            <span className="capitalize">{match.stage.replace(/-/g, " ")}</span>
          </p>
          <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">
            {homeTeam.name} vs {awayTeam.name}
          </h1>
          <p className="text-sm font-semibold text-slate-600">
            {formatDate(match.date)} &middot; {formatMatchTime(match.date)} &middot; {venue.name}, {venue.location}
          </p>
          {match.referee && (
            <p className="text-xs font-semibold text-slate-400">Referee: {match.referee}</p>
          )}
        </div>

        {/* Two-column lineups */}
        <div className="grid gap-8 sm:grid-cols-2">
          {[
            { team: homeTeam, players: homePlayers, formation: match.formationHome },
            { team: awayTeam, players: awayPlayers, formation: match.formationAway },
          ].map(({ team, players, formation }) => (
            <div key={team.id} className="space-y-3">
              {/* Team header */}
              <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
                <Image src={team.logo} alt={team.name} width={36} height={36} className="h-8 w-8 object-contain" />
                <div>
                  <p className="font-bold text-slate-950">{team.name}</p>
                  {formation && <p className="text-[11px] font-semibold text-slate-400">{formation}</p>}
                </div>
              </div>

              {/* Players by position */}
              {players.length > 0 ? (
                <div className="space-y-3">
                  {POSITION_ORDER.map((group) => {
                    const grouped = players.filter((p) => p.positionGroup === group);
                    if (!grouped.length) return null;
                    return (
                      <div key={group}>
                        <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">{group}s</p>
                        <table className="w-full border-collapse text-xs">
                          <tbody>
                            {grouped.map((player) => (
                              <tr key={player.id} className="border-b border-slate-100">
                                <td className="w-8 py-1.5 font-bold text-slate-950">{player.number}</td>
                                <td className="py-1.5 font-semibold text-slate-800">{player.name}</td>
                                <td className="py-1.5 text-right text-[10px] font-bold text-slate-400">{player.detailedPosition}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs font-semibold text-slate-400">Lineup pending announcement.</p>
              )}

              {/* Coach */}
              <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-xs">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Coach</span>
                <span className="font-semibold text-slate-700">{team.coach}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Officials strip */}
        <div className="rounded-xl border border-slate-200 p-4 text-xs font-semibold text-slate-600">
          <div className="grid gap-2 sm:grid-cols-3">
            <p><span className="font-bold text-slate-950">Referee: </span>{match.referee ?? "TBC"}</p>
            <p><span className="font-bold text-slate-950">Venue: </span>{venue.name}</p>
            <p><span className="font-bold text-slate-950">Kickoff: </span>{formatMatchTime(match.date)}</p>
          </div>
        </div>

        {/* Print-only footer */}
        <p className="hidden text-center text-[10px] text-slate-400 print:block">
          Johnvents Apex League &mdash; Official Match Day Team Sheet &mdash; {formatDate(match.date)}
        </p>
      </div>
    </>
  );
}