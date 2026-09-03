"use client";

import { type ReactNode, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  FiAward,
  FiCheckCircle,
  FiPlay,
  FiShuffle,
  FiTrash2,
} from "react-icons/fi";
import { AdminModal } from "./AdminModal";
import {
  autoAssignPotsAction,
  clearCompetitionFixturesAction,
  generateGroupFixturesAction,
  generateKnockoutAction,
  seedSuperCupAction,
} from "../(protected)/fixtures/generator-actions";

type CompetitionOption = {
  id: string;
  name: string;
  type: string;
  plannedTeams: number;
  potCount: number;
  opponentsPerPot: number;
  includeOwnPotOpponents: boolean;
};

type TournamentDrawModalProps = {
  competitions: CompetitionOption[];
  canWrite: boolean;
};

export default function TournamentDrawModal({
  competitions,
  canWrite,
}: TournamentDrawModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCompId, setSelectedCompId] = useState(
    competitions[0]?.id || "",
  );
  const [activeTab, setActiveTab] = useState<
    "pots" | "group" | "knockout" | "supercup"
  >("pots");
  const [isPending, setIsPending] = useState(false);

  const selectedComp =
    competitions.find((c) => c.id === selectedCompId) || competitions[0];
  const selectedPotCount = selectedComp?.potCount ?? 4;
  const selectedOpponentsPerPot = selectedComp?.opponentsPerPot ?? 1;
  const selectedIncludesOwnPot = selectedComp?.includeOwnPotOpponents ?? true;
  const minimumMatchdays = Math.max(
    3,
    selectedOpponentsPerPot *
      (selectedPotCount - (selectedIncludesOwnPot ? 0 : 1)),
  );
  const matchdayOptions = Array.from(
    { length: Math.max(10, minimumMatchdays) - 2 },
    (_, index) => index + 3,
  );
  const potCardStyles = [
    "bg-red-50 text-red-500",
    "bg-indigo-50 text-indigo-700",
    "bg-amber-50 text-amber-700",
    "bg-emerald-50 text-emerald-700",
    "bg-sky-50 text-sky-700",
    "bg-slate-50 text-slate-700",
  ];

  const handleAction = async (actionFn: () => Promise<void>) => {
    try {
      setIsPending(true);
      await actionFn();
    } finally {
      setIsPending(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-red-500 to-indigo-700 px-4 text-xs font-bold text-white shadow-sm transition hover:from-red-600 hover:to-indigo-800"
      >
        <FiShuffle className="h-4 w-4" aria-hidden="true" />
        Tournament Draw &amp; Fixture Generator
      </button>

      <AdminModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Tournament Draw &amp; Fixture Engine"
        description="Automate pot allocation, league-phase pairings across neutral venues, knockout brackets, and Super Cup pathways."
      >
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <label className="mb-1.5 block text-xs font-bold text-slate-500">
              Select Competition
            </label>
            <select
              value={selectedCompId}
              onChange={(event) => setSelectedCompId(event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-red-500"
            >
              {competitions.map((competition) => (
                <option key={competition.id} value={competition.id}>
                  {competition.name} ({competition.type} -{" "}
                  {competition.plannedTeams} teams - {competition.potCount} pots)
                </option>
              ))}
            </select>
          </div>

          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("pots")}
              className={`h-10 flex-1 rounded-lg transition ${
                activeTab === "pots"
                  ? "bg-white text-red-500 shadow-sm"
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              Pots &amp; Draw
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("group")}
              className={`h-10 flex-1 rounded-lg transition ${
                activeTab === "group"
                  ? "bg-white text-red-500 shadow-sm"
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              League Fixtures
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("knockout")}
              className={`h-10 flex-1 rounded-lg transition ${
                activeTab === "knockout"
                  ? "bg-white text-red-500 shadow-sm"
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              Knockouts (Top 8)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("supercup")}
              className={`h-10 flex-1 rounded-lg transition ${
                activeTab === "supercup"
                  ? "bg-white text-red-500 shadow-sm"
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              Super Cup (32)
            </button>
          </div>

          {activeTab === "pots" && (
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
              <div>
                <h4 className="text-sm font-bold text-slate-950">
                  {selectedPotCount}-Pot Distribution
                </h4>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  Splits all registered clubs evenly across the configured pots.
                  The league phase will use those pot numbers when pairing teams.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-3">
                {Array.from({ length: selectedPotCount }, (_, index) => {
                  const potNumber = index + 1;
                  const style = potCardStyles[index % potCardStyles.length];

                  return (
                    <div
                      key={potNumber}
                      className={`rounded-lg p-2.5 ${style}`}
                    >
                      <p className="font-bold">Pot {potNumber}</p>
                      <p className="text-[11px] text-slate-500">
                        Seed tier {potNumber}
                      </p>
                    </div>
                  );
                })}
              </div>

              <form action={autoAssignPotsAction.bind(null, selectedCompId)}>
                <SubmitButton
                  disabled={!canWrite || isPending}
                  icon={<FiShuffle />}
                  idleLabel={`Auto-Draw Pots for ${selectedComp?.name || "Competition"}`}
                  pendingLabel="Drawing pots..."
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-red-500 text-xs font-bold text-white shadow-sm transition hover:bg-red-600 disabled:bg-slate-300"
                />
              </form>
            </div>
          )}

          {activeTab === "group" && (
            <form
              action={generateGroupFixturesAction}
              className="space-y-4 rounded-xl border border-slate-200 bg-white p-4"
            >
              <input
                type="hidden"
                name="competitionId"
                value={selectedCompId}
              />
              <div>
                <h4 className="text-sm font-bold text-slate-950">
                  League Phase Schedule Generator
                </h4>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  Pairs each team against the configured number of teams from
                  each eligible pot at neutral venues.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-lg bg-slate-50 p-2.5">
                  <p className="font-bold text-slate-500">Pots</p>
                  <p className="mt-1 font-bold text-slate-950">
                    {selectedPotCount}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-2.5">
                  <p className="font-bold text-slate-500">Opp/pot</p>
                  <p className="mt-1 font-bold text-slate-950">
                    {selectedOpponentsPerPot}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-2.5">
                  <p className="font-bold text-slate-500">Own pot</p>
                  <p className="mt-1 font-bold text-slate-950">
                    {selectedIncludesOwnPot ? "Yes" : "No"}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-bold text-slate-700">
                  Minimum matchdays
                  <select
                    name="matchdaysCount"
                    key={`${selectedCompId}-${minimumMatchdays}`}
                    defaultValue={String(minimumMatchdays)}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs font-semibold outline-none focus:border-blue-600"
                  >
                    {matchdayOptions.map((matchdayCount) => (
                      <option key={matchdayCount} value={matchdayCount}>
                        {matchdayCount} Matchdays
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-xs font-bold text-slate-700">
                  Tournament Kickoff Date
                  <input
                    type="date"
                    name="startDate"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs font-semibold outline-none focus:border-blue-600"
                  />
                </label>
              </div>

              <SubmitButton
                disabled={!canWrite || isPending}
                icon={<FiPlay />}
                idleLabel="Generate League Phase Fixtures"
                pendingLabel="Generating matches..."
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 text-xs font-bold text-white shadow-sm transition hover:bg-blue-800 disabled:bg-slate-300"
              />

              <div className="border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() =>
                    handleAction(() =>
                      clearCompetitionFixturesAction(selectedCompId),
                    )
                  }
                  disabled={!canWrite || isPending}
                  className="flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                >
                  <FiTrash2 className="h-3.5 w-3.5" />
                  Clear Unplayed Fixtures (Reset)
                </button>
              </div>
            </form>
          )}

          {activeTab === "knockout" && (
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
              <div>
                <h4 className="text-sm font-bold text-slate-950">
                  Knockout Stage (Top 8 Seeds)
                </h4>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  Pulls the Top 8 ranked teams from the league-phase table and
                  generates the bracket.
                </p>
              </div>

              <div className="space-y-2 rounded-lg bg-slate-50 p-3 text-xs">
                <p className="font-bold text-slate-700">Quarter-Finals:</p>
                <ul className="list-disc space-y-1 pl-4 font-medium text-slate-600">
                  <li>QF1: Rank 1 vs Rank 8</li>
                  <li>QF2: Rank 2 vs Rank 7</li>
                  <li>QF3: Rank 3 vs Rank 6</li>
                  <li>QF4: Rank 4 vs Rank 5</li>
                </ul>
                <p className="mt-2 font-bold text-slate-700">
                  Semi-Finals, 3rd Place &amp; Grand Final:
                </p>
                <p className="text-slate-500">
                  Ties decided by direct penalty shootout.
                </p>
              </div>

              <form action={generateKnockoutAction.bind(null, selectedCompId)}>
                <SubmitButton
                  disabled={!canWrite || isPending}
                  icon={<FiAward />}
                  idleLabel="Generate Knockout Bracket (Top 8)"
                  pendingLabel="Generating knockout bracket..."
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-indigo-700 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-800 disabled:bg-slate-300"
                />
              </form>
            </div>
          )}

          {activeTab === "supercup" && (
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
              <div>
                <h4 className="text-sm font-bold text-slate-950">
                  Super Cup 32-Team Pathway
                </h4>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  Takes the top 8 teams from each eligible LGA competition in
                  the selected season to build the 32-team Super Cup roster.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {[1, 2, 3, 4].map((sourceNumber) => (
                  <div
                    key={sourceNumber}
                    className="rounded-lg border border-slate-200 p-2.5"
                  >
                    <p className="font-bold text-slate-950">
                      Source competition {sourceNumber}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Top 8 Qualifiers
                    </p>
                  </div>
                ))}
              </div>

              <form action={seedSuperCupAction.bind(null, selectedCompId)}>
                <SubmitButton
                  disabled={!canWrite || isPending}
                  icon={<FiCheckCircle />}
                  idleLabel="Seed 32-Team Super Cup Roster & Pots"
                  pendingLabel="Seeding Super Cup..."
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:bg-slate-300"
                />
              </form>
            </div>
          )}

          {!canWrite && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
              Connect Supabase in <code>.env</code> to execute live database
              writes.
            </p>
          )}
        </div>
      </AdminModal>
    </>
  );
}

function SubmitButton({
  className,
  disabled,
  icon,
  idleLabel,
  pendingLabel,
}: {
  className: string;
  disabled: boolean;
  icon: ReactNode;
  idleLabel: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={disabled || pending} className={className}>
      {icon}
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
