"use client";

import { useState } from "react";
import { FiCheck, FiX, FiActivity, FiShield } from "react-icons/fi";
import type { LiveSquadPlayer } from "@/lib/admin-fixtures";

type TeamInfo = {
  id: string;
  competitionTeamId: string;
  name: string;
  shortName: string;
  squad: LiveSquadPlayer[];
};

type LiveEventLoggerProps = {
  matchId: string;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  databaseReady: boolean;
  onLogGoal: (fd: FormData) => Promise<void>;
  onLogCard: (fd: FormData) => Promise<void>;
  onLogSubstitution: (fd: FormData) => Promise<void>;
  onLogPenalty: (fd: FormData) => Promise<void>;
};

export default function LiveEventLogger({
  matchId,
  homeTeam,
  awayTeam,
  databaseReady,
  onLogGoal,
  onLogCard,
  onLogSubstitution,
  onLogPenalty,
}: LiveEventLoggerProps) {
  const [activeTab, setActiveTab] = useState<"goal" | "card" | "sub" | "penalty">("goal");
  const [selectedTeamId, setSelectedTeamId] = useState<string>(homeTeam.competitionTeamId);

  const currentTeam = selectedTeamId === homeTeam.competitionTeamId ? homeTeam : awayTeam;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-950">Record Match Event</h3>
          <p className="text-xs font-semibold text-slate-500">
            Log real-time goals, discipline, substitutions, or penalty shootouts.
          </p>
        </div>
      </div>

      {/* Team Switcher Pills */}
      <div className="my-4">
        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
          Active Team
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSelectedTeamId(homeTeam.competitionTeamId)}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition border ${
              selectedTeamId === homeTeam.competitionTeamId
                ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            {homeTeam.name} ({homeTeam.shortName})
          </button>
          <button
            type="button"
            onClick={() => setSelectedTeamId(awayTeam.competitionTeamId)}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition border ${
              selectedTeamId === awayTeam.competitionTeamId
                ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-indigo-600" />
            {awayTeam.name} ({awayTeam.shortName})
          </button>
        </div>
      </div>

      {/* Event Category Tabs */}
      <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab("goal")}
          className={`flex-1 rounded-lg py-2 transition ${
            activeTab === "goal" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-950"
          }`}
        >
          ⚽ Goal
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("card")}
          className={`flex-1 rounded-lg py-2 transition ${
            activeTab === "card" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-950"
          }`}
        >
          🟨 Card
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("sub")}
          className={`flex-1 rounded-lg py-2 transition ${
            activeTab === "sub" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-950"
          }`}
        >
          🔄 Substitution
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("penalty")}
          className={`flex-1 rounded-lg py-2 transition ${
            activeTab === "penalty" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-950"
          }`}
        >
          🥅 Shootout
        </button>
      </div>

      {/* Tab 1: Goal Form */}
      {activeTab === "goal" && (
        <form action={onLogGoal} className="mt-4 space-y-4">
          <input type="hidden" name="matchId" value={matchId} />
          <input type="hidden" name="competitionTeamId" value={selectedTeamId} />

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-bold text-slate-700">
              Minute
              <input
                type="number"
                name="minute"
                min="1"
                max="120"
                defaultValue="45"
                required
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600"
              />
            </label>

            <label className="block text-xs font-bold text-slate-700">
              Goal Type
              <select
                name="goalType"
                defaultValue="GOAL"
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600"
              >
                <option value="GOAL">⚽ Regular Goal</option>
                <option value="PENALTY_SCORED">⚽ Penalty Kick Scored</option>
                <option value="OWN_GOAL">⚽ Own Goal</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-bold text-slate-700">
              Goalscorer ({currentTeam.shortName})
              <select
                name="playerId"
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600"
              >
                <option value="">— Select Scorer —</option>
                {currentTeam.squad.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.number} {p.name} ({p.position})
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-bold text-slate-700">
              Assist Provider (optional)
              <select
                name="assistPlayerId"
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600"
              >
                <option value="">— None / Solo Effort —</option>
                {currentTeam.squad.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.number} {p.name} ({p.position})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block text-xs font-bold text-slate-700">
            Note / Description (optional)
            <input
              type="text"
              name="note"
              placeholder="e.g. Header from corner kick, 25-yard strike"
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600"
            />
          </label>

          <button
            type="submit"
            disabled={!databaseReady}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 text-xs font-bold text-white shadow-sm transition hover:bg-blue-800 disabled:bg-slate-300"
          >
            ⚽ Log Goal &amp; Increment Score
          </button>
        </form>
      )}

      {/* Tab 2: Card Form */}
      {activeTab === "card" && (
        <form action={onLogCard} className="mt-4 space-y-4">
          <input type="hidden" name="matchId" value={matchId} />
          <input type="hidden" name="competitionTeamId" value={selectedTeamId} />

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-bold text-slate-700">
              Minute
              <input
                type="number"
                name="minute"
                min="1"
                max="120"
                defaultValue="30"
                required
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600"
              />
            </label>

            <label className="block text-xs font-bold text-slate-700">
              Card Type
              <select
                name="cardType"
                defaultValue="YELLOW_CARD"
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600"
              >
                <option value="YELLOW_CARD">🟨 Yellow Card</option>
                <option value="RED_CARD">🟥 Red Card</option>
              </select>
            </label>
          </div>

          <label className="block text-xs font-bold text-slate-700">
            Player ({currentTeam.shortName})
            <select
              name="playerId"
              required
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600"
            >
              <option value="">— Select Carded Player —</option>
              {currentTeam.squad.map((p) => (
                <option key={p.id} value={p.id}>
                  #{p.number} {p.name} ({p.position})
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-bold text-slate-700">
            Reason / Note (optional)
            <input
              type="text"
              name="note"
              placeholder="e.g. Tactical foul, dissent, dangerous tackle"
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600"
            />
          </label>

          <button
            type="submit"
            disabled={!databaseReady}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-amber-600 text-xs font-bold text-white shadow-sm transition hover:bg-amber-700 disabled:bg-slate-300"
          >
            🟨 Record Disciplinary Event
          </button>
        </form>
      )}

      {/* Tab 3: Substitution Form */}
      {activeTab === "sub" && (
        <form action={onLogSubstitution} className="mt-4 space-y-4">
          <input type="hidden" name="matchId" value={matchId} />
          <input type="hidden" name="competitionTeamId" value={selectedTeamId} />

          <label className="block text-xs font-bold text-slate-700">
            Minute
            <input
              type="number"
              name="minute"
              min="1"
              max="120"
              defaultValue="60"
              required
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-bold text-slate-700">
              Player Out (Subbed off)
              <select
                name="playerOutId"
                required
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600"
              >
                <option value="">— Select Player Out —</option>
                {currentTeam.squad.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.number} {p.name} ({p.position})
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-bold text-slate-700">
              Player In (Subbed on)
              <select
                name="playerInId"
                required
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600"
              >
                <option value="">— Select Player In —</option>
                {currentTeam.squad.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.number} {p.name} ({p.position})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block text-xs font-bold text-slate-700">
            Note / Tactical Context (optional)
            <input
              type="text"
              name="note"
              placeholder="e.g. Tactical substitution, injury replacement"
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600"
            />
          </label>

          <button
            type="submit"
            disabled={!databaseReady}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-800 text-xs font-bold text-white shadow-sm transition hover:bg-slate-900 disabled:bg-slate-300"
          >
            🔄 Record Substitution
          </button>
        </form>
      )}

      {/* Tab 4: Penalty Shootout Form */}
      {activeTab === "penalty" && (
        <form action={onLogPenalty} className="mt-4 space-y-4">
          <input type="hidden" name="matchId" value={matchId} />
          <input type="hidden" name="competitionTeamId" value={selectedTeamId} />

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-bold text-slate-700">
              Penalty Taker ({currentTeam.shortName})
              <select
                name="takerId"
                required
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600"
              >
                <option value="">— Select Taker —</option>
                {currentTeam.squad.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.number} {p.name} ({p.position})
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-bold text-slate-700">
              Shootout Round
              <select
                name="round"
                defaultValue="1"
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600"
              >
                <option value="1">Round 1</option>
                <option value="2">Round 2</option>
                <option value="3">Round 3</option>
                <option value="4">Round 4</option>
                <option value="5">Round 5</option>
                <option value="6">Sudden Death (Round 6+)</option>
              </select>
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Attempt Outcome
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 p-3 font-bold text-xs text-emerald-800 has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-100">
                <input type="radio" name="scored" value="true" defaultChecked className="accent-emerald-600" />
                <FiCheck className="text-emerald-700" /> Scored
              </label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-300 bg-red-50 p-3 font-bold text-xs text-red-800 has-[:checked]:border-red-600 has-[:checked]:bg-red-100">
                <input type="radio" name="scored" value="false" className="accent-red-600" />
                <FiX className="text-red-700" /> Missed / Saved
              </label>
            </div>
          </div>

          <label className="block text-xs font-bold text-slate-700">
            Note (optional)
            <input
              type="text"
              name="note"
              placeholder="e.g. Bottom left corner, saved by keeper"
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600"
            />
          </label>

          <button
            type="submit"
            disabled={!databaseReady}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-purple-700 text-xs font-bold text-white shadow-sm transition hover:bg-purple-800 disabled:bg-slate-300"
          >
            🥅 Record Shootout Attempt
          </button>
        </form>
      )}
    </div>
  );
}
