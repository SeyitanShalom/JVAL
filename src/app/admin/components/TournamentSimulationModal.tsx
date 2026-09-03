"use client";

import { useState } from "react";
import { FiZap, FiPlay, FiRotateCcw, FiAward } from "react-icons/fi";
import { AdminModal } from "./AdminModal";
import {
  simulateMatchdayAction,
  simulateFullTournamentAction,
  resetCompetitionSimulationAction,
} from "../(protected)/fixtures/simulation-actions";

type CompetitionOption = {
  id: string;
  name: string;
  type: string;
  plannedTeams: number;
};

type TournamentSimulationModalProps = {
  competitions: CompetitionOption[];
  canWrite: boolean;
};

export default function TournamentSimulationModal({
  competitions,
  canWrite,
}: TournamentSimulationModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCompId, setSelectedCompId] = useState(
    competitions[0]?.id || "",
  );
  const [activeTab, setActiveTab] = useState<"matchday" | "full" | "reset">(
    "matchday",
  );
  const [matchdayChoice, setMatchdayChoice] = useState("all");

  const selectedComp =
    competitions.find((c) => c.id === selectedCompId) || competitions[0];

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-4 h-10 text-xs font-bold text-white shadow-sm transition hover:from-amber-600 hover:to-orange-700"
      >
        <FiZap className="h-4 w-4" aria-hidden="true" />
        Simulation &amp; Sandbox
      </button>

      <AdminModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Tournament Simulation &amp; Sandbox"
        description="Simulate realistic matchday scores, goalscorers, cards, penalty shootouts, and automatically progress knockout brackets."
      >
        <div className="space-y-5">
          {/* Competition Selector */}
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
            <label className="block text-xs font-bold text-slate-500 mb-1.5">
              Target Competition
            </label>
            <select
              value={selectedCompId}
              onChange={(e) => setSelectedCompId(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-600"
            >
              {competitions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type} · {c.plannedTeams} teams)
                </option>
              ))}
            </select>
          </div>

          {/* Tab navigation */}
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("matchday")}
              className={`flex-1 rounded-lg h-10 transition ${
                activeTab === "matchday"
                  ? "bg-white text-orange-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              ⚡ Matchday Simulation
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("full")}
              className={`flex-1 rounded-lg h-10 transition ${
                activeTab === "full"
                  ? "bg-white text-orange-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              🏆 Full Tournament Run
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("reset")}
              className={`flex-1 rounded-lg h-10 transition ${
                activeTab === "reset"
                  ? "bg-white text-red-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              🔄 Reset / Clear
            </button>
          </div>

          {/* TAB 1: Matchday Simulation */}
          {activeTab === "matchday" && (
            <form action={simulateMatchdayAction} className="space-y-4">
              <input
                type="hidden"
                name="competitionId"
                value={selectedComp?.id}
              />

              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                <h4 className="text-xs font-bold text-amber-900">
                  What will happen:
                </h4>
                <ul className="mt-2 space-y-1 text-xs font-semibold text-amber-800 list-disc list-inside">
                  <li>
                    Simulates realistic scorelines, goal events, cards, and
                    tactical substitutions.
                  </li>
                  <li>
                    Knockout matches ending in draws will undergo simulated
                    penalty shootouts.
                  </li>
                  <li>
                    League tables, Golden Boot, assists, and clean sheet
                    leaderboards update instantly.
                  </li>
                </ul>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Round / Matchday to Simulate
                </label>
                <select
                  name="matchday"
                  value={matchdayChoice}
                  onChange={(e) => setMatchdayChoice(e.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-blue-600"
                >
                  <option value="all">⚡ All Upcoming Matches</option>
                  <option value="Matchday 1">Matchday 1</option>
                  <option value="Matchday 2">Matchday 2</option>
                  <option value="Matchday 3">Matchday 3</option>
                  <option value="Matchday 4">Matchday 4</option>
                  <option value="Round of 16">Round of 16</option>
                  <option value="Quarter-final">Quarter-finals</option>
                  <option value="Semi-final">Semi-finals</option>
                  <option value="Final">Grand Final</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={!canWrite}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-orange-600 text-xs font-bold text-white shadow transition hover:bg-orange-700 disabled:opacity-50"
              >
                <FiPlay className="h-4 w-4" />
                Simulate{" "}
                {matchdayChoice === "all"
                  ? "All Upcoming Matches"
                  : matchdayChoice}
              </button>
            </form>
          )}

          {/* TAB 2: Full Tournament Simulation */}
          {activeTab === "full" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
                <h4 className="text-xs font-bold text-indigo-900">
                  End-to-End Tournament Simulation
                </h4>
                <p className="mt-1 text-xs text-indigo-800 font-semibold leading-relaxed">
                  Simulates the entire tournament lifecycle for{" "}
                  <strong>{selectedComp?.name}</strong>:
                </p>
                <ol className="mt-2 space-y-1 text-xs font-semibold text-indigo-800 list-decimal list-inside">
                  <li>
                    Simulates all group matches with realistic player stats.
                  </li>
                  <li>
                    Finalizes league table standings and head-to-head
                    tiebreakers.
                  </li>
                  <li>Generates Top-8 single-elimination knockout bracket.</li>
                  <li>
                    Simulates Quarter-finals, advances winners to Semi-finals.
                  </li>
                  <li>
                    Simulates Semi-finals, advances winners to Final &amp;
                    losers to 3rd Place.
                  </li>
                  <li>
                    Simulates Final, crowns Champion, and registers Tournament
                    Award Record!
                  </li>
                </ol>
              </div>

              <form
                action={simulateFullTournamentAction.bind(
                  null,
                  selectedComp?.id || "",
                )}
              >
                <button
                  type="submit"
                  disabled={!canWrite}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 text-xs font-bold text-white shadow transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  <FiAward className="h-4 w-4" />
                  Run Full End-to-End Tournament Simulation
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: Reset Tournament */}
          {activeTab === "reset" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-red-200 bg-red-50/60 p-4">
                <h4 className="text-xs font-bold text-red-900">
                  Reset Match Records
                </h4>
                <p className="mt-1 text-xs text-red-800 font-semibold leading-relaxed">
                  Clears all goals, cards, penalty attempts, and resets group
                  fixtures in <strong>{selectedComp?.name}</strong> back to
                  UPCOMING. Standings and player stats will be reset to zero.
                </p>
              </div>

              <form
                action={resetCompetitionSimulationAction.bind(
                  null,
                  selectedComp?.id || "",
                )}
              >
                <button
                  type="submit"
                  disabled={!canWrite}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-red-600 text-xs font-bold text-white shadow transition hover:bg-red-700 disabled:opacity-50"
                >
                  <FiRotateCcw className="h-4 w-4" />
                  Reset Matches &amp; Standings to Upcoming
                </button>
              </form>
            </div>
          )}
        </div>
      </AdminModal>
    </>
  );
}
