"use client";

import { useState } from "react";
import {
  FiPlay,
  FiShuffle,
  FiAward,
  FiTrash2,
  FiCheckCircle,
} from "react-icons/fi";
import { AdminModal } from "./AdminModal";
import {
  autoAssignPotsAction,
  generateGroupFixturesAction,
  generateKnockoutAction,
  seedSuperCupAction,
  clearCompetitionFixturesAction,
} from "../(protected)/fixtures/generator-actions";

type CompetitionOption = {
  id: string;
  name: string;
  type: string;
  plannedTeams: number;
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
        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-500 to-indigo-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:from-red-600 hover:to-indigo-800"
      >
        <FiShuffle className="h-4 w-4" aria-hidden="true" />
        Tournament Draw &amp; Fixture Generator
      </button>

      <AdminModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Tournament Draw &amp; Fixture Engine"
        description="Automate pot allocation, group match pairings across neutral venues, knockout brackets, and Super Cup pathways."
      >
        <div className="space-y-5">
          {/* Competition Selector */}
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
            <label className="block text-xs font-bold text-slate-500 mb-1.5">
              Select Competition
            </label>
            <select
              value={selectedCompId}
              onChange={(e) => setSelectedCompId(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-red-500"
            >
              {competitions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type} · {c.plannedTeams} teams)
                </option>
              ))}
            </select>
          </div>

          {/* Navigation Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("pots")}
              className={`flex-1 rounded-lg py-2 transition ${
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
              className={`flex-1 rounded-lg py-2 transition ${
                activeTab === "group"
                  ? "bg-white text-red-500 shadow-sm"
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              Group Fixtures
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("knockout")}
              className={`flex-1 rounded-lg py-2 transition ${
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
              className={`flex-1 rounded-lg py-2 transition ${
                activeTab === "supercup"
                  ? "bg-white text-red-500 shadow-sm"
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              Super Cup (32)
            </button>
          </div>

          {/* Tab 1: Pots & Draw */}
          {activeTab === "pots" && (
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
              <div>
                <h4 className="text-sm font-bold text-slate-950">
                  4-Pot Distribution
                </h4>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  Splits all registered clubs evenly across Pot 1, Pot 2, Pot 3,
                  and Pot 4. Fixture generator will pair teams across pots.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="rounded-lg bg-red-50 p-2.5">
                  <p className="font-bold text-red-500">Pot 1</p>
                  <p className="text-[11px] text-slate-500">Top seeds</p>
                </div>
                <div className="rounded-lg bg-indigo-50 p-2.5">
                  <p className="font-bold text-indigo-700">Pot 2</p>
                  <p className="text-[11px] text-slate-500">Tier 2 seeds</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-2.5">
                  <p className="font-bold text-amber-700">Pot 3</p>
                  <p className="text-[11px] text-slate-500">Tier 3 seeds</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-2.5">
                  <p className="font-bold text-slate-700">Pot 4</p>
                  <p className="text-[11px] text-slate-500">Tier 4 seeds</p>
                </div>
              </div>

              <form action={autoAssignPotsAction.bind(null, selectedCompId)}>
                <button
                  type="submit"
                  disabled={!canWrite || isPending}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-500 text-xs font-bold text-white shadow-sm transition hover:bg-red-600 disabled:bg-slate-300"
                >
                  <FiShuffle />
                  {isPending
                    ? "Drawing pots..."
                    : `Auto-Draw Pots for ${selectedComp?.name || "Competition"}`}
                </button>
              </form>
            </div>
          )}

          {/* Tab 2: Group Stage Generator */}
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
                  Group Schedule Generator
                </h4>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  Pairs each team against 1–2 teams from each pot at neutral
                  venues avoiding venue/time conflicts.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-bold text-slate-700">
                  Rounds / Matchdays
                  <select
                    name="matchdaysCount"
                    defaultValue="4"
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 font-semibold text-xs outline-none focus:border-blue-600"
                  >
                    <option value="3">3 Matchdays</option>
                    <option value="4">4 Matchdays (Standard)</option>
                    <option value="5">5 Matchdays</option>
                    <option value="6">6 Matchdays</option>
                  </select>
                </label>

                <label className="block text-xs font-bold text-slate-700">
                  Tournament Kickoff Date
                  <input
                    type="date"
                    name="startDate"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 font-semibold text-xs outline-none focus:border-blue-600"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={!canWrite || isPending}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 text-xs font-bold text-white shadow-sm transition hover:bg-blue-800 disabled:bg-slate-300"
              >
                <FiPlay />
                {isPending
                  ? "Generating matches..."
                  : "Generate Group Stage Fixtures"}
              </button>

              <div className="border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() =>
                    handleAction(() =>
                      clearCompetitionFixturesAction(selectedCompId),
                    )
                  }
                  disabled={!canWrite || isPending}
                  className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                >
                  <FiTrash2 className="h-3.5 w-3.5" />
                  Clear Unplayed Fixtures (Reset)
                </button>
              </div>
            </form>
          )}

          {/* Tab 3: Knockout Bracket (Top 8) */}
          {activeTab === "knockout" && (
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
              <div>
                <h4 className="text-sm font-bold text-slate-950">
                  Knockout Stage (Top 8 Seeds)
                </h4>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  Pulls the Top 8 ranked teams from the group stage table and
                  generates the bracket:
                </p>
              </div>

              <div className="space-y-2 rounded-lg bg-slate-50 p-3 text-xs">
                <p className="font-bold text-slate-700">⚽ Quarter-Finals:</p>
                <ul className="list-disc pl-4 space-y-1 text-slate-600 font-medium">
                  <li>QF1: Rank 1 vs Rank 8</li>
                  <li>QF2: Rank 2 vs Rank 7</li>
                  <li>QF3: Rank 3 vs Rank 6</li>
                  <li>QF4: Rank 4 vs Rank 5</li>
                </ul>
                <p className="font-bold text-slate-700 mt-2">
                  🏆 Semi-Finals, 3rd Place &amp; Grand Final:
                </p>
                <p className="text-slate-500">
                  Ties decided by direct penalty shootout (no extra time).
                </p>
              </div>

              <form action={generateKnockoutAction.bind(null, selectedCompId)}>
                <button
                  type="submit"
                  disabled={!canWrite || isPending}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-700 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-800 disabled:bg-slate-300"
                >
                  <FiAward />
                  {isPending
                    ? "Generating knockout bracket..."
                    : "Generate Knockout Bracket (Top 8)"}
                </button>
              </form>
            </div>
          )}

          {/* Tab 4: Super Cup (32 Teams) */}
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
                <div className="rounded-lg border border-slate-200 p-2.5">
                  <p className="font-bold text-slate-950">
                    Source competition 1
                  </p>
                  <p className="text-[11px] text-slate-500">Top 8 Qualifiers</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-2.5">
                  <p className="font-bold text-slate-950">
                    Source competition 2
                  </p>
                  <p className="text-[11px] text-slate-500">Top 8 Qualifiers</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-2.5">
                  <p className="font-bold text-slate-950">Source competition 3</p>
                  <p className="text-[11px] text-slate-500">Top 8 Qualifiers</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-2.5">
                  <p className="font-bold text-slate-950">Source competition 4</p>
                  <p className="text-[11px] text-slate-500">Top 8 Qualifiers</p>
                </div>
              </div>

              <form action={seedSuperCupAction.bind(null, selectedCompId)}>
                <button
                  type="submit"
                  disabled={!canWrite || isPending}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:bg-slate-300"
                >
                  <FiCheckCircle />
                  {isPending
                    ? "Seeding Super Cup..."
                    : "Seed 32-Team Super Cup Roster &amp; Pots"}
                </button>
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
