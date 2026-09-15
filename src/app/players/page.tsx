import Image from "next/image";
import Link from "next/link";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import CompactFilterForm from "../components/CompactFilterForm";
import FilterSelect from "../components/FilterSelect";
import SectionHeader from "../components/SectionHeader";
import { calculateAge } from "@/lib/league-data";
import {
  getPublicCompetitionFilterLabel,
  getPublicPlayersData,
} from "@/lib/public-data";

const positionOptions = [
  { value: "all", label: "All positions" },
  { value: "Goalkeeper", label: "Goalkeepers" },
  { value: "Defender", label: "Defenders" },
  { value: "Midfielder", label: "Midfielders" },
  { value: "Forward", label: "Forwards" },
];

type PlayersQuery = {
  season?: string;
  competition?: string;
  team?: string;
  position?: string;
  page?: string;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<PlayersQuery>;
}) {
  const query = await searchParams;
  const data = await getPublicPlayersData(query);

  const selectedCompetition = query.competition ?? "all";
  const selectedSeason = query.season ?? data.seasonsList[0]?.id ?? "all";
  const selectedTeam = query.team ?? "all";
  const selectedPosition = query.position ?? "all";
  const selectedCompetitionRecord = data.competitionsList.find(
    (competition) =>
      competition.id === selectedCompetition ||
      competition.slug === selectedCompetition,
  );
  const isPendingSuperCupFilter =
    selectedCompetitionRecord?.type === "Super Cup" &&
    selectedCompetitionRecord.status === "upcoming";

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <SectionHeader
        eyebrow="Squad Registry"
        title="Players"
        description="Player records, squad numbers, positions, and live tournament statistics."
      />

      <CompactFilterForm
        resultLabel={`${data.pagination.totalPlayers} player${data.pagination.totalPlayers !== 1 ? "s" : ""}`}
        submitLabel="Apply Filter"
      >
        <FilterSelect
          label="Season"
          name="season"
          value={selectedSeason}
          options={[
            { value: "all", label: "All seasons" },
            ...data.seasonsList.map((s) => ({
              value: s.id,
              label: s.label,
            })),
          ]}
        />
        <FilterSelect
          label="Competition"
          name="competition"
          value={selectedCompetition}
          options={[
            { value: "all", label: "All competitions" },
            ...data.competitionsList.map((c) => ({
              value: c.id,
              label: getPublicCompetitionFilterLabel(c),
            })),
          ]}
        />
        <FilterSelect
          label="Team"
          name="team"
          value={selectedTeam}
          options={[
            { value: "all", label: "All teams" },
            ...data.teamsList.map((t) => ({ value: t.id, label: t.name })),
          ]}
        />
        <FilterSelect
          label="Position"
          name="position"
          value={selectedPosition}
          options={positionOptions}
        />
      </CompactFilterForm>

      <p className="text-xs font-semibold text-slate-500">
        {getPlayerRangeLabel(data.pagination, data.players.length)}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.players.map((player) => (
          <Link
            key={player.id}
            href={`/players/${player.slug}`}
            className="group overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-red-500 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <Image
                src={player.photo}
                alt={`${player.name} photo`}
                width={56}
                height={56}
                className="h-12 w-12 rounded-lg object-cover sm:h-14 sm:w-14"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-950 transition group-hover:text-red-500">
                  #{player.number} {player.name}
                </p>
                <p className="truncate text-xs font-semibold text-slate-500">
                  {player.teamName ?? "Team TBC"}
                </p>
                <p className="text-[11px] font-bold text-red-500">
                  {player.detailedPosition}{" "}
                  <span aria-hidden="true">&middot;</span> Age{" "}
                  {calculateAge(player.dateOfBirth)}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <Stat
                label="Goals"
                value={player.goals.toString()}
                highlight={player.goals > 0}
              />
              <Stat label="Assists" value={player.assists.toString()} />
              <Stat label="Apps" value={player.appearances.toString()} />
            </div>
          </Link>
        ))}
        {data.players.length === 0 && (
          <div className="col-span-full rounded-lg border border-slate-200 bg-white p-8 text-center sm:p-12">
            <p className="text-sm font-bold text-slate-500">
              {isPendingSuperCupFilter
                ? "Super Cup players will appear once the competition becomes active."
                : "No players match the selected filter."}
            </p>
          </div>
        )}
      </div>

      <PlayersPagination pagination={data.pagination} query={query} />
    </section>
  );
}

function PlayersPagination({
  pagination,
  query,
}: {
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalPlayers: number;
  };
  query: PlayersQuery;
}) {
  if (pagination.totalPages <= 1) return null;

  const pages = Array.from(
    new Set(
      [
        1,
        pagination.page - 1,
        pagination.page,
        pagination.page + 1,
        pagination.totalPages,
      ].filter((page) => page >= 1 && page <= pagination.totalPages),
    ),
  );

  return (
    <nav
      aria-label="Players pagination"
      className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-xs font-bold text-slate-500">
        Page {pagination.page} of {pagination.totalPages}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <PageLink
          href={buildPlayersPageHref(query, pagination.page - 1)}
          disabled={pagination.page === 1}
          label="Previous"
          icon="previous"
        />
        {pages.map((pageNumber, index) => (
          <div key={pageNumber} className="flex items-center gap-2">
            {index > 0 && pageNumber - pages[index - 1] > 1 ? (
              <span className="text-xs font-bold text-slate-300">...</span>
            ) : null}
            <Link
              href={buildPlayersPageHref(query, pageNumber)}
              aria-current={pageNumber === pagination.page ? "page" : undefined}
              className={`grid h-9 min-w-9 place-items-center rounded-lg px-3 text-xs font-bold transition ${
                pageNumber === pagination.page
                  ? "bg-red-500 text-white"
                  : "border border-slate-200 text-slate-600 hover:border-red-300 hover:text-red-500"
              }`}
            >
              {pageNumber}
            </Link>
          </div>
        ))}
        <PageLink
          href={buildPlayersPageHref(query, pagination.page + 1)}
          disabled={pagination.page === pagination.totalPages}
          label="Next"
          icon="next"
        />
      </div>
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  label,
  icon,
}: {
  href: string;
  disabled: boolean;
  label: string;
  icon: "previous" | "next";
}) {
  const content = (
    <>
      {icon === "previous" ? (
        <FiChevronLeft className="h-4 w-4" aria-hidden="true" />
      ) : null}
      <span>{label}</span>
      {icon === "next" ? (
        <FiChevronRight className="h-4 w-4" aria-hidden="true" />
      ) : null}
    </>
  );

  if (disabled) {
    return (
      <span className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-300">
        {content}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:border-red-300 hover:text-red-500"
    >
      {content}
    </Link>
  );
}

function buildPlayersPageHref(query: PlayersQuery, page: number) {
  const params = new URLSearchParams();

  for (const key of ["season", "competition", "team", "position"] as const) {
    const value = query[key];

    if (value && value !== "all") {
      params.set(key, value);
    }
  }

  if (page > 1) {
    params.set("page", page.toString());
  }

  const queryString = params.toString();

  return queryString ? `/players?${queryString}` : "/players";
}

function getPlayerRangeLabel(
  pagination: {
    page: number;
    pageSize: number;
    totalPlayers: number;
  },
  visibleCount: number,
) {
  if (pagination.totalPlayers === 0) {
    return "No players found";
  }

  const start = (pagination.page - 1) * pagination.pageSize + 1;
  const end = start + visibleCount - 1;

  return `Showing ${start}-${end} of ${pagination.totalPlayers} players`;
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </p>
      <p
        className={`mt-0.5 text-base font-bold ${highlight ? "text-red-500" : "text-slate-950"}`}
      >
        {value}
      </p>
    </div>
  );
}
