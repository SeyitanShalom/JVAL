import Image from "next/image";
import Link from "next/link";
import type { BracketMatch } from "@/lib/public-data";

// --- CONSTANTS ---------------------------------------------------------------

const STAGE_LABELS: Record<string, string> = {
  "round-of-16": "Round of 16",
  "quarter-final": "Quarter-Finals",
  "semi-final": "Semi-Finals",
  "third-place": "3rd Place",
  final: "Final",
};

const STAGE_ORDER = [
  "round-of-16",
  "quarter-final",
  "semi-final",
  "third-place",
  "final",
];

// --- HELPER ------------------------------------------------------------------

function getWinnerId(m: BracketMatch): string | null {
  if (m.status !== "finished") return null;
  if (m.homeScore === null || m.awayScore === null) return null;
  if (m.homeScore > m.awayScore) return m.home?.id ?? null;
  if (m.awayScore > m.homeScore) return m.away?.id ?? null;
  if (m.penalties) {
    return m.penalties.home > m.penalties.away
      ? (m.home?.id ?? null)
      : (m.away?.id ?? null);
  }
  return null;
}

// --- SUB-COMPONENTS ----------------------------------------------------------

function TeamRow({
  team,
  score,
  penScore,
  isWinner,
  isTbd,
}: {
  team: BracketMatch["home"];
  score: number | null;
  penScore?: number;
  isWinner: boolean;
  isTbd: boolean;
}) {
  const hasScore = score !== null;

  if (isTbd || !team) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-slate-300 bg-white text-[10px] font-bold text-slate-400">
          ?
        </div>
        <span className="text-xs font-bold italic text-slate-400">TBD</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 transition ${
        isWinner
          ? "bg-blue-600 text-white shadow-sm"
          : hasScore
            ? "bg-slate-100 text-slate-500"
            : "border border-slate-200 bg-white text-slate-800"
      }`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <Image
          src={team.logo}
          alt={team.name}
          width={22}
          height={22}
          className="h-[22px] w-[22px] shrink-0 object-contain"
        />
        <span className="truncate text-xs font-bold">{team.shortName}</span>
      </div>
      {hasScore && (
        <div className="flex shrink-0 items-center gap-1">
          <span className={`text-sm font-bold ${isWinner ? "text-white" : "text-slate-700"}`}>
            {score}
          </span>
          {penScore !== undefined && (
            <span className={`text-[10px] font-bold ${isWinner ? "text-blue-200" : "text-slate-400"}`}>
              ({penScore})
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function MatchSlot({ match }: { match: BracketMatch }) {
  const winnerId = getWinnerId(match);
  const isFinal = match.stage === "final";

  const card = (
    <div
      className={`relative flex flex-col gap-1.5 rounded-xl border bg-white p-2 shadow-sm ${
        isFinal ? "border-amber-300 ring-1 ring-amber-200" : "border-slate-200"
      } ${match.status === "live" ? "ring-1 ring-green-400" : ""}`}
    >
      {match.status === "live" && (
        <span className="absolute -top-2.5 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-green-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
          Live
        </span>
      )}

      <TeamRow
        team={match.home}
        score={match.homeScore}
        penScore={match.penalties?.home}
        isWinner={winnerId === match.home?.id}
        isTbd={!match.home}
      />
      <div className="flex items-center gap-2 px-1">
        <div className="h-px flex-1 bg-slate-100" />
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">vs</span>
        <div className="h-px flex-1 bg-slate-100" />
      </div>
      <TeamRow
        team={match.away}
        score={match.awayScore}
        penScore={match.penalties?.away}
        isWinner={winnerId === match.away?.id}
        isTbd={!match.away}
      />
    </div>
  );

  if (match.status !== "upcoming") {
    return (
      <Link href={`/matches/${match.slug}`} className="block transition hover:opacity-90">
        {card}
      </Link>
    );
  }
  return card;
}

function RoundColumn({
  stage,
  matches,
}: {
  stage: string;
  matches: BracketMatch[];
}) {
  const isSpecial = stage === "final" || stage === "third-place";
  return (
    <div className="flex flex-col gap-4">
      <h3
        className={`text-center text-[10px] font-bold uppercase tracking-[0.14em] ${
          isSpecial ? "text-amber-600" : "text-slate-500"
        }`}
      >
        {STAGE_LABELS[stage] ?? stage}
      </h3>
      <div className="flex flex-col justify-around gap-3">
        {matches.map((m) => (
          <MatchSlot key={m.id} match={m} />
        ))}
      </div>
    </div>
  );
}

// --- MAIN COMPONENT ----------------------------------------------------------

type Props = {
  matches: BracketMatch[];
};

export default function KnockoutBracket({ matches }: Props) {
  const byStage: Record<string, BracketMatch[]> = {};
  for (const m of matches) {
    if (!byStage[m.stage]) byStage[m.stage] = [];
    byStage[m.stage].push(m);
  }

  for (const stage of Object.keys(byStage)) {
    byStage[stage].sort((a, b) => a.matchNumber - b.matchNumber);
  }

  const orderedStages = STAGE_ORDER.filter((s) => byStage[s]?.length);
  if (orderedStages.length === 0) return null;

  // 3rd-place sits beneath the main bracket
  const mainStages = orderedStages.filter((s) => s !== "third-place");
  const hasThirdPlace = Boolean(byStage["third-place"]?.length);

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div
        className="grid items-start gap-6"
        style={{
          gridTemplateColumns: `repeat(${mainStages.length}, minmax(168px, 1fr))`,
          minWidth: `${mainStages.length * 184}px`,
        }}
      >
        {mainStages.map((stage) => (
          <RoundColumn key={stage} stage={stage} matches={byStage[stage]} />
        ))}
      </div>

      {hasThirdPlace && (
        <div className="mt-5 border-t border-slate-200 pt-5">
          <div style={{ maxWidth: "200px" }}>
            <RoundColumn stage="third-place" matches={byStage["third-place"]} />
          </div>
        </div>
      )}
    </div>
  );
}
